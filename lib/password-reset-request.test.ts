import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyFixedWindowFailure,
  applyVerifiedPasswordReset,
  type PasswordResetTransaction,
} from "./auth-throttle";
import {
  PASSWORD_RESET_IP_MAX,
  PASSWORD_RESET_IP_WINDOW_MS,
  PASSWORD_RESET_TOKEN_TTL_MS,
  createPasswordResetTokenMaterial,
  derivePasswordResetIpHash,
  dummyPasswordResetCrypto,
  executePasswordResetRequest,
  normalizePasswordResetEmail,
  type PasswordResetIpThrottleStore,
  type PasswordResetRequestDeps,
  type PasswordResetTokenIssuer,
  type PasswordResetIpThrottleRow,
} from "./password-reset-throttle";

const TEST_SECRET = "test-auth-secret-min-32-chars-long!!";
const HERE = dirname(fileURLToPath(import.meta.url));

class SerialLock {
  private tail: Promise<void> = Promise.resolve();
  run<T>(fn: () => Promise<T> | T): Promise<T> {
    const next = this.tail.then(() => fn());
    this.tail = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }
}

class MemoryPasswordResetIpStore implements PasswordResetIpThrottleStore {
  readonly rows = new Map<string, PasswordResetIpThrottleRow>();
  private readonly locks = new Map<string, SerialLock>();

  private lock(key: string) {
    let lock = this.locks.get(key);
    if (!lock) {
      lock = new SerialLock();
      this.locks.set(key, lock);
    }
    return lock;
  }

  async getIpThrottle(ipHash: string) {
    return this.rows.get(ipHash) ?? null;
  }

  async recordIpRequest(ipHash: string, now: Date) {
    await this.lock(ipHash).run(() => {
      this.rows.set(
        ipHash,
        applyFixedWindowFailure(
          this.rows.get(ipHash) ?? null,
          now,
          PASSWORD_RESET_IP_WINDOW_MS,
        ),
      );
    });
  }
}

type StoredToken = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

class MemoryPasswordResetTokenIssuer implements PasswordResetTokenIssuer {
  readonly tokens = new Map<string, StoredToken[]>();
  private readonly locks = new Map<string, SerialLock>();
  missingUserIds = new Set<string>();

  private lock(userId: string) {
    let lock = this.locks.get(userId);
    if (!lock) {
      lock = new SerialLock();
      this.locks.set(userId, lock);
    }
    return lock;
  }

  liveToken(userId: string, now: Date) {
    return (this.tokens.get(userId) ?? []).find(
      (row) => row.expiresAt.getTime() > now.getTime(),
    );
  }

  async issueForUser(userId: string, now: Date) {
    return this.lock(userId).run(() => {
      if (this.missingUserIds.has(userId)) return { kind: "missing" as const };
      const live = this.liveToken(userId, now);
      if (live) return { kind: "held" as const };
      const material = createPasswordResetTokenMaterial(now);
      const row: StoredToken = {
        id: `tok-${Math.random().toString(16).slice(2)}`,
        userId,
        tokenHash: material.tokenHash,
        expiresAt: material.expiresAt,
      };
      const list = this.tokens.get(userId) ?? [];
      list.push(row);
      this.tokens.set(userId, list);
      return {
        kind: "created" as const,
        plaintextToken: material.plaintextToken,
        tokenId: row.id,
      };
    });
  }

  deleteById(tokenId: string) {
    for (const [userId, list] of this.tokens) {
      this.tokens.set(
        userId,
        list.filter((row) => row.id !== tokenId),
      );
    }
  }
}

function headersForIp(ip: string) {
  return new Headers({ "x-forwarded-for": ip });
}

function hashToken(plaintext: string) {
  return createHash("sha256").update(plaintext).digest("hex");
}

async function request(
  email: unknown,
  overrides: Partial<PasswordResetRequestDeps> & {
    usersList?: Array<{ id: string; email: string }>;
    tokens?: MemoryPasswordResetTokenIssuer;
    ipThrottle?: PasswordResetIpThrottleStore | MemoryPasswordResetIpStore | null;
    emails?: string[];
    dummyCalls?: { count: number };
  } = {},
) {
  const tokens = overrides.tokens ?? new MemoryPasswordResetTokenIssuer();
  const ipThrottle =
    overrides.ipThrottle === undefined
      ? new MemoryPasswordResetIpStore()
      : overrides.ipThrottle;
  const emails = overrides.emails ?? [];
  const dummyCalls = overrides.dummyCalls ?? { count: 0 };
  const usersList = overrides.usersList ?? [
    { id: "user-1", email: "participant@example.test" },
  ];

  const result = await executePasswordResetRequest(email, {
    users: overrides.users ?? {
      findByEmail: async (value) =>
        usersList.find((user) => user.email === value) ?? null,
    },
    tokens,
    ipThrottle,
    sendEmail:
      overrides.sendEmail ??
      (async (destination, token) => {
        emails.push(`${destination}:${token}`);
      }),
    deleteTokenById:
      overrides.deleteTokenById ??
      (async (tokenId) => {
        tokens.deleteById(tokenId);
      }),
    dummyCrypto:
      overrides.dummyCrypto ??
      (() => {
        dummyCalls.count += 1;
        dummyPasswordResetCrypto();
      }),
    hmacSecret:
      overrides.hmacSecret === undefined ? TEST_SECRET : overrides.hmacSecret,
    headers: overrides.headers ?? headersForIp("203.0.113.10"),
    now: overrides.now ?? new Date("2026-09-20T20:00:00.000Z"),
  });

  return { result, tokens, ipThrottle, emails, dummyCalls };
}

describe("normalizePasswordResetEmail", () => {
  it("trims and lowercases", () => {
    assert.equal(
      normalizePasswordResetEmail("  Foo@Bar.COM  "),
      "foo@bar.com",
    );
  });

  it("treats missing and blank values as invalid", () => {
    assert.equal(normalizePasswordResetEmail(""), null);
    assert.equal(normalizePasswordResetEmail("   "), null);
    assert.equal(normalizePasswordResetEmail(null), null);
  });
});

describe("executePasswordResetRequest", () => {
  it("returns generic success for known and unknown emails", async () => {
    const known = await request("participant@example.test");
    const unknown = await request("missing@example.test");
    assert.deepEqual(known.result, { success: true });
    assert.deepEqual(unknown.result, { success: true });
  });

  it("retains missing-email validation", async () => {
    const result = await request("");
    assert.deepEqual(result.result, { error: "Email is required" });
  });

  it("creates a hashed one-hour token and sends one email on first known request", async () => {
    const now = new Date("2026-09-20T20:00:00.000Z");
    const { result, tokens, emails } = await request(
      "  Participant@Example.TEST  ",
      { now },
    );
    assert.deepEqual(result, { success: true });
    const live = tokens.liveToken("user-1", now);
    assert.ok(live);
    assert.equal(emails.length, 1);
    assert.match(emails[0]!, /^participant@example\.test:/);
    const plaintext = emails[0]!.split(":")[1]!;
    assert.equal(live.tokenHash, hashToken(plaintext));
    assert.notEqual(live.tokenHash, plaintext);
    assert.equal(
      live.expiresAt.getTime(),
      now.getTime() + PASSWORD_RESET_TOKEN_TTL_MS,
    );
  });

  it("does not replace a live token or send a second email", async () => {
    const tokens = new MemoryPasswordResetTokenIssuer();
    const emails: string[] = [];
    const now = new Date("2026-09-20T20:00:00.000Z");
    await request("participant@example.test", { tokens, emails, now });
    const first = tokens.liveToken("user-1", now);
    await request("participant@example.test", { tokens, emails, now });
    const second = tokens.liveToken("user-1", now);
    assert.equal(emails.length, 1);
    assert.equal(first?.id, second?.id);
    assert.equal(first?.tokenHash, second?.tokenHash);
    assert.equal((tokens.tokens.get("user-1") ?? []).length, 1);
  });

  it("unknown email creates no token, sends no email, and uses dummy crypto", async () => {
    const dummyCalls = { count: 0 };
    const { tokens, emails } = await request("missing@example.test", {
      dummyCalls,
    });
    assert.equal(tokens.tokens.size, 0);
    assert.equal(emails.length, 0);
    assert.equal(dummyCalls.count, 1);
  });

  it("counts IP requests and blocks after 20 without extending the window", async () => {
    const ipThrottle = new MemoryPasswordResetIpStore();
    const now = new Date("2026-09-20T20:00:00.000Z");
    const ipHash = derivePasswordResetIpHash(
      headersForIp("203.0.113.10"),
      TEST_SECRET,
    );
    assert.ok(ipHash);

    for (let i = 0; i < PASSWORD_RESET_IP_MAX; i++) {
      const { result } = await request(`missing${i}@example.test`, {
        ipThrottle,
        now,
      });
      assert.deepEqual(result, { success: true });
    }

    const afterBudget = await ipThrottle.getIpThrottle(ipHash);
    assert.equal(afterBudget?.attemptCount, PASSWORD_RESET_IP_MAX);
    const windowStart = afterBudget?.windowStart.getTime();

    const dummyCalls = { count: 0 };
    const blockedKnown = await request("participant@example.test", {
      ipThrottle,
      now: new Date(now.getTime() + 60_000),
      dummyCalls,
    });
    const blockedUnknown = await request("missing@example.test", {
      ipThrottle,
      now: new Date(now.getTime() + 60_000),
    });
    assert.deepEqual(blockedKnown.result, { success: true });
    assert.deepEqual(blockedUnknown.result, { success: true });
    assert.equal(dummyCalls.count, 1);
    assert.equal(blockedKnown.emails.length, 0);
    const still = await ipThrottle.getIpThrottle(ipHash);
    assert.equal(still?.attemptCount, PASSWORD_RESET_IP_MAX);
    assert.equal(still?.windowStart.getTime(), windowStart);
  });

  it("starts a fresh IP window after expiry", async () => {
    const ipThrottle = new MemoryPasswordResetIpStore();
    const now = new Date("2026-09-20T20:00:00.000Z");
    const ipHash = derivePasswordResetIpHash(
      headersForIp("203.0.113.10"),
      TEST_SECRET,
    );
    assert.ok(ipHash);
    for (let i = 0; i < PASSWORD_RESET_IP_MAX; i++) {
      await request("missing@example.test", { ipThrottle, now });
    }
    const later = new Date(now.getTime() + PASSWORD_RESET_IP_WINDOW_MS);
    await request("missing@example.test", { ipThrottle, now: later });
    const row = await ipThrottle.getIpThrottle(ipHash);
    assert.equal(row?.attemptCount, 1);
    assert.equal(row?.windowStart.getTime(), later.getTime());
  });

  it("fails open when throttle read or write fails", async () => {
    const throwingRead: PasswordResetIpThrottleStore = {
      getIpThrottle: async () => {
        throw new Error("read failed");
      },
      recordIpRequest: async () => {},
    };
    const throwingWrite: PasswordResetIpThrottleStore = {
      getIpThrottle: async () => null,
      recordIpRequest: async () => {
        throw new Error("write failed");
      },
    };

    const read = await request("participant@example.test", {
      ipThrottle: throwingRead,
    });
    const write = await request("participant@example.test", {
      ipThrottle: throwingWrite,
    });
    assert.deepEqual(read.result, { success: true });
    assert.equal(read.emails.length, 1);
    assert.deepEqual(write.result, { success: true });
    assert.equal(write.emails.length, 1);
  });

  it("skips IP hashing when the HMAC secret is missing", () => {
    const headers = headersForIp("203.0.113.10");
    assert.equal(derivePasswordResetIpHash(headers, null), null);
    assert.equal(derivePasswordResetIpHash(headers, "  "), null);
    const withSecret = derivePasswordResetIpHash(headers, TEST_SECRET);
    const emptyKey = createHmac("sha256", "")
      .update("203.0.113.10", "utf8")
      .digest("hex");
    assert.ok(withSecret);
    assert.notEqual(withSecret, emptyKey);
  });

  it("fails open without counting when HMAC secret is missing", async () => {
    const ipThrottle = new MemoryPasswordResetIpStore();
    const { result, emails } = await request("participant@example.test", {
      ipThrottle,
      hmacSecret: null,
    });
    assert.deepEqual(result, { success: true });
    assert.equal(emails.length, 1);
    assert.equal(ipThrottle.rows.size, 0);
  });

  it("serializes concurrent first requests to one token and one email", async () => {
    const tokens = new MemoryPasswordResetTokenIssuer();
    const emails: string[] = [];
    const now = new Date("2026-09-20T20:00:00.000Z");
    await Promise.all([
      request("participant@example.test", { tokens, emails, now }),
      request("participant@example.test", { tokens, emails, now }),
      request("participant@example.test", { tokens, emails, now }),
    ]);
    assert.equal((tokens.tokens.get("user-1") ?? []).length, 1);
    assert.equal(emails.length, 1);
  });

  it("deletes only the new token after email failure and allows retry", async () => {
    const tokens = new MemoryPasswordResetTokenIssuer();
    const now = new Date("2026-09-20T20:00:00.000Z");
    let shouldFail = true;
    const first = await executePasswordResetRequest(
      "participant@example.test",
      {
        users: {
          findByEmail: async () => ({ id: "user-1" }),
        },
        tokens,
        ipThrottle: new MemoryPasswordResetIpStore(),
        sendEmail: async () => {
          if (shouldFail) throw new Error("provider down");
        },
        deleteTokenById: async (tokenId) => {
          tokens.deleteById(tokenId);
        },
        hmacSecret: TEST_SECRET,
        headers: headersForIp("203.0.113.10"),
        now,
      },
    );
    assert.deepEqual(first, { success: true });
    assert.equal(tokens.liveToken("user-1", now), undefined);

    shouldFail = false;
    const emails: string[] = [];
    const retry = await request("participant@example.test", {
      tokens,
      emails,
      now,
    });
    assert.deepEqual(retry.result, { success: true });
    assert.equal(emails.length, 1);
    assert.ok(tokens.liveToken("user-1", now));
  });

  it("keeps an existing live token usable after later requests", async () => {
    const tokens = new MemoryPasswordResetTokenIssuer();
    const emails: string[] = [];
    const now = new Date("2026-09-20T20:00:00.000Z");
    await request("participant@example.test", { tokens, emails, now });
    const original = tokens.liveToken("user-1", now);
    await request("participant@example.test", { tokens, emails, now });
    assert.equal(tokens.liveToken("user-1", now)?.tokenHash, original?.tokenHash);
  });
});

describe("AUTH-2.1 privacy and isolation", () => {
  it("does not touch AUTH-2 login throttle tables", () => {
    const source = readFileSync(
      join(HERE, "password-reset-throttle.ts"),
      "utf8",
    );
    const action = readFileSync(
      join(HERE, "../actions/password-reset.ts"),
      "utf8",
    );
    assert.doesNotMatch(source, /login_throttles/);
    assert.doesNotMatch(source, /login_ip_throttles/);
    assert.doesNotMatch(action, /loginIpThrottle/);
    assert.doesNotMatch(action, /recordIpFailure/);
    assert.match(action, /applyVerifiedPasswordReset/);
  });

  it("AUTH-2.1 logs do not include email, IP, hash, token, or URL", () => {
    const files = [
      readFileSync(join(HERE, "password-reset-throttle.ts"), "utf8"),
      readFileSync(join(HERE, "../actions/password-reset.ts"), "utf8"),
      readFileSync(join(HERE, "email.ts"), "utf8"),
    ].join("\n");
    assert.match(files, /\[auth\] password reset email failed/);
    assert.match(files, /\[auth\] password reset throttle unavailable/);
    assert.doesNotMatch(
      files,
      /email sent to \$\{/,
    );
    assert.doesNotMatch(files, /\[sendPasswordResetEmail\] error:/);
  });
});

describe("resetPassword AUTH-1/AUTH-2 behavior remains", () => {
  it("still consumes the token, increments authVersion, and clears LoginThrottle", async () => {
    const now = new Date("2026-09-20T20:00:00.000Z");
    const tokens = new Map<
      string,
      { id: string; userId: string; tokenHash: string; expiresAt: Date }
    >();
    tokens.set("tok-1", {
      id: "tok-1",
      userId: "user-1",
      tokenHash: "hash-1",
      expiresAt: new Date(now.getTime() + 60_000),
    });
    const pairThrottles = new Map<string, number>([
      ["user-1\0ip-a", 4],
      ["other\0ip-a", 1],
    ]);
    const user = { id: "user-1", password: "old", authVersion: 2 };
    const tx: PasswordResetTransaction = {
      passwordResetToken: {
        async findFirst(args) {
          const found = [...tokens.values()].find(
            (row) =>
              row.tokenHash === args.where.tokenHash &&
              row.expiresAt.getTime() > args.where.expiresAt.gt.getTime(),
          );
          return found ? { id: found.id, userId: found.userId } : null;
        },
        async deleteMany(args) {
          const row = tokens.get(args.where.id);
          if (!row || row.tokenHash !== args.where.tokenHash) return { count: 0 };
          tokens.delete(row.id);
          return { count: 1 };
        },
      },
      user: {
        async updateMany(args) {
          if (args.where.id !== user.id) return;
          user.password = args.data.password;
          user.authVersion += args.data.authVersion.increment;
        },
      },
      loginThrottle: {
        async deleteMany(args) {
          for (const key of [...pairThrottles.keys()]) {
            if (key.startsWith(`${args.where.userId}\0`)) {
              pairThrottles.delete(key);
            }
          }
        },
      },
    };

    await applyVerifiedPasswordReset(tx, {
      tokenHash: "hash-1",
      hashedPassword: "new",
      now,
    });
    assert.equal(tokens.size, 0);
    assert.equal(user.authVersion, 3);
    assert.equal(user.password, "new");
    assert.equal(pairThrottles.has("user-1\0ip-a"), false);
    assert.equal(pairThrottles.get("other\0ip-a"), 1);
  });
});
