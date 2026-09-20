import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  authorizeCredentials,
  type AuthUserRecord,
  type PasswordVerifier,
} from "./authorize-credentials";
import {
  LOGIN_THROTTLE_IP_MAX,
  LOGIN_THROTTLE_PAIR_MAX,
  LOGIN_THROTTLE_WINDOW_MS,
  deriveLoginIpHash,
  type LoginThrottleStore,
} from "./auth-throttle";
import { MemoryLoginThrottleStore } from "./login-throttle-memory";

const TEST_SECRET = "test-auth-secret-min-32-chars-long!!";

const instantVerifier: PasswordVerifier = {
  async compare(password, passwordHash) {
    return password === passwordHash;
  },
  async dummyCompare() {},
};

function requestForIp(ip: string) {
  return new Request("https://example.test/login", {
    headers: { "x-forwarded-for": ip },
  });
}

function participant(overrides: Partial<AuthUserRecord> = {}): AuthUserRecord {
  return {
    id: "user-participant",
    email: "participant@example.test",
    role: "PARTICIPANT",
    password: "correct-password",
    authVersion: 4,
    ...overrides,
  };
}

function lookup(users: AuthUserRecord[]) {
  return {
    async findByEmail(email: string) {
      return users.find((user) => user.email === email) ?? null;
    },
  };
}

async function authorize(args: {
  email: string;
  password: string;
  ip: string;
  users: AuthUserRecord[];
  throttles: LoginThrottleStore;
  now?: Date;
  verifier?: PasswordVerifier;
}) {
  return authorizeCredentials({
    email: args.email,
    password: args.password,
    request: requestForIp(args.ip),
    users: lookup(args.users),
    throttles: args.throttles,
    now: args.now,
    hmacSecret: TEST_SECRET,
    verifier: args.verifier ?? instantVerifier,
  });
}

describe("authorizeCredentials", () => {
  it("authenticates a correct password and returns authVersion", async () => {
    const user = participant();
    const result = await authorize({
      email: user.email,
      password: "correct-password",
      ip: "203.0.113.10",
      users: [user],
      throttles: new MemoryLoginThrottleStore(),
    });
    assert.deepEqual(result, {
      id: user.id,
      email: user.email,
      role: "PARTICIPANT",
      authVersion: 4,
    });
  });

  it("records pair and IP failures for a wrong password", async () => {
    const user = participant();
    const throttles = new MemoryLoginThrottleStore();
    const now = new Date("2026-09-20T19:00:00.000Z");
    const result = await authorize({
      email: user.email,
      password: "wrong-password",
      ip: "203.0.113.10",
      users: [user],
      throttles,
      now,
    });
    assert.equal(result, null);
    const ipHash = deriveLoginIpHash(requestForIp("203.0.113.10"), TEST_SECRET);
    assert.equal((await throttles.getPairThrottle(user.id, ipHash))?.attemptCount, 1);
    assert.equal((await throttles.getIpThrottle(ipHash))?.attemptCount, 1);
    assert.equal(user.authVersion, 4);
  });

  it("records IP-only state for an unknown email and returns generic failure", async () => {
    const throttles = new MemoryLoginThrottleStore();
    const user = participant();
    const result = await authorize({
      email: "missing@example.test",
      password: "wrong-password",
      ip: "203.0.113.10",
      users: [user],
      throttles,
    });
    assert.equal(result, null);
    const ipHash = deriveLoginIpHash(requestForIp("203.0.113.10"), TEST_SECRET);
    assert.equal((await throttles.getIpThrottle(ipHash))?.attemptCount, 1);
    assert.equal(throttles.pair.size, 0);
  });

  it("blocks further pair attempts after the threshold without extending the window", async () => {
    const user = participant();
    const throttles = new MemoryLoginThrottleStore();
    const now = new Date("2026-09-20T19:00:00.000Z");
    const ip = "203.0.113.10";
    const ipHash = deriveLoginIpHash(requestForIp(ip), TEST_SECRET);

    for (let i = 0; i < LOGIN_THROTTLE_PAIR_MAX; i++) {
      const failed = await authorize({
        email: user.email,
        password: "wrong-password",
        ip,
        users: [user],
        throttles,
        now,
      });
      assert.equal(failed, null);
    }

    const afterBudget = await throttles.getPairThrottle(user.id, ipHash);
    assert.equal(afterBudget?.attemptCount, LOGIN_THROTTLE_PAIR_MAX);
    const windowStart = afterBudget?.windowStart.getTime();

    const blocked = await authorize({
      email: user.email,
      password: "wrong-password",
      ip,
      users: [user],
      throttles,
      now: new Date(now.getTime() + 60_000),
    });
    assert.equal(blocked, null);
    const stillBlocked = await throttles.getPairThrottle(user.id, ipHash);
    assert.equal(stillBlocked?.attemptCount, LOGIN_THROTTLE_PAIR_MAX);
    assert.equal(stillBlocked?.windowStart.getTime(), windowStart);

    const correctStillBlocked = await authorize({
      email: user.email,
      password: "correct-password",
      ip,
      users: [user],
      throttles,
      now: new Date(now.getTime() + 60_000),
    });
    assert.equal(correctStillBlocked, null);
  });

  it("does not globally lock the same user from another IP", async () => {
    const user = participant();
    const throttles = new MemoryLoginThrottleStore();
    const now = new Date("2026-09-20T19:00:00.000Z");

    for (let i = 0; i < LOGIN_THROTTLE_PAIR_MAX; i++) {
      await authorize({
        email: user.email,
        password: "wrong-password",
        ip: "203.0.113.10",
        users: [user],
        throttles,
        now,
      });
    }

    const otherIpSuccess = await authorize({
      email: user.email,
      password: "correct-password",
      ip: "198.51.100.20",
      users: [user],
      throttles,
      now,
    });
    assert.equal(otherIpSuccess?.id, user.id);
  });

  it("blocks additional attempts after the IP threshold", async () => {
    const throttles = new MemoryLoginThrottleStore();
    const now = new Date("2026-09-20T19:00:00.000Z");
    const ip = "203.0.113.10";
    const ipHash = deriveLoginIpHash(requestForIp(ip), TEST_SECRET);

    for (let i = 0; i < LOGIN_THROTTLE_IP_MAX; i++) {
      const failed = await authorize({
        email: "missing@example.test",
        password: "wrong-password",
        ip,
        users: [],
        throttles,
        now,
      });
      assert.equal(failed, null);
    }

    assert.equal((await throttles.getIpThrottle(ipHash))?.attemptCount, LOGIN_THROTTLE_IP_MAX);

    const blockedUnknown = await authorize({
      email: "missing@example.test",
      password: "wrong-password",
      ip,
      users: [],
      throttles,
      now: new Date(now.getTime() + 30_000),
    });
    assert.equal(blockedUnknown, null);
    assert.equal((await throttles.getIpThrottle(ipHash))?.attemptCount, LOGIN_THROTTLE_IP_MAX);

    const knownUser = participant();
    const blockedKnown = await authorize({
      email: knownUser.email,
      password: "correct-password",
      ip,
      users: [knownUser],
      throttles,
      now: new Date(now.getTime() + 30_000),
    });
    assert.equal(blockedKnown, null);
  });

  it("starts a fresh window after the original 15-minute window expires", async () => {
    const user = participant();
    const throttles = new MemoryLoginThrottleStore();
    const now = new Date("2026-09-20T19:00:00.000Z");
    const ip = "203.0.113.10";

    for (let i = 0; i < LOGIN_THROTTLE_PAIR_MAX; i++) {
      await authorize({
        email: user.email,
        password: "wrong-password",
        ip,
        users: [user],
        throttles,
        now,
      });
    }

    const later = new Date(now.getTime() + LOGIN_THROTTLE_WINDOW_MS);
    const success = await authorize({
      email: user.email,
      password: "correct-password",
      ip,
      users: [user],
      throttles,
      now: later,
    });
    assert.equal(success?.id, user.id);
  });

  it("clears the user's pair throttles after a successful login", async () => {
    const user = participant();
    const throttles = new MemoryLoginThrottleStore();
    const now = new Date("2026-09-20T19:00:00.000Z");
    await authorize({
      email: user.email,
      password: "wrong-password",
      ip: "203.0.113.10",
      users: [user],
      throttles,
      now,
    });
    await authorize({
      email: user.email,
      password: "wrong-password",
      ip: "198.51.100.20",
      users: [user],
      throttles,
      now,
    });

    const success = await authorize({
      email: user.email,
      password: "correct-password",
      ip: "203.0.113.10",
      users: [user],
      throttles,
      now,
    });
    assert.equal(success?.id, user.id);
    assert.equal(throttles.pair.size, 0);
    assert.ok(throttles.ip.size > 0);
  });

  it("still authenticates if throttle cleanup fails", async () => {
    const user = participant();
    const inner = new MemoryLoginThrottleStore();
    const throttles: LoginThrottleStore = {
      getIpThrottle: (...args) => inner.getIpThrottle(...args),
      getPairThrottle: (...args) => inner.getPairThrottle(...args),
      recordIpFailure: (...args) => inner.recordIpFailure(...args),
      recordPairFailure: (...args) => inner.recordPairFailure(...args),
      clearUserPairThrottles: async () => {
        throw new Error("cleanup unavailable");
      },
    };
    const result = await authorize({
      email: user.email,
      password: "correct-password",
      ip: "203.0.113.10",
      users: [user],
      throttles,
    });
    assert.equal(result?.id, user.id);
  });

  it("fails open when throttle persistence cannot be read or written", async () => {
    const user = participant();
    const throwing: LoginThrottleStore = {
      getIpThrottle: async () => {
        throw new Error("read failed");
      },
      getPairThrottle: async () => {
        throw new Error("read failed");
      },
      recordIpFailure: async () => {
        throw new Error("write failed");
      },
      recordPairFailure: async () => {
        throw new Error("write failed");
      },
      clearUserPairThrottles: async () => {
        throw new Error("clear failed");
      },
    };

    const success = await authorize({
      email: user.email,
      password: "correct-password",
      ip: "203.0.113.10",
      users: [user],
      throttles: throwing,
    });
    assert.equal(success?.authVersion, 4);

    const failure = await authorize({
      email: user.email,
      password: "wrong-password",
      ip: "203.0.113.10",
      users: [user],
      throttles: throwing,
    });
    assert.equal(failure, null);
  });

  it("protects ADMIN and PARTICIPANT through the same mechanism", async () => {
    const admin = participant({
      id: "user-admin",
      email: "admin@example.test",
      role: "ADMIN",
      authVersion: 1,
    });
    const member = participant();
    const throttles = new MemoryLoginThrottleStore();
    const now = new Date("2026-09-20T19:00:00.000Z");
    const ip = "203.0.113.10";

    for (let i = 0; i < LOGIN_THROTTLE_PAIR_MAX; i++) {
      assert.equal(
        await authorize({
          email: admin.email,
          password: "wrong-password",
          ip,
          users: [admin, member],
          throttles,
          now,
        }),
        null,
      );
    }

    assert.equal(
      await authorize({
        email: admin.email,
        password: "correct-password",
        ip,
        users: [admin, member],
        throttles,
        now,
      }),
      null,
    );
    assert.equal(
      (
        await authorize({
          email: member.email,
          password: "correct-password",
          ip,
          users: [admin, member],
          throttles,
          now,
        })
      )?.role,
      "PARTICIPANT",
    );
  });

  it("does not increment authVersion on failed login", async () => {
    const user = participant({ authVersion: 9 });
    await authorize({
      email: user.email,
      password: "wrong-password",
      ip: "203.0.113.10",
      users: [user],
      throttles: new MemoryLoginThrottleStore(),
    });
    assert.equal(user.authVersion, 9);
  });
});

describe("user-visible login error", () => {
  it("keeps a single generic Invalid email or password message", () => {
    const loginPage = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../app/(auth)/login/page.tsx"),
      "utf8",
    );
    assert.match(loginPage, /Invalid email or password/);
    assert.doesNotMatch(loginPage, /account locked/i);
    assert.doesNotMatch(loginPage, /too many attempts/i);
    assert.doesNotMatch(loginPage, /IP throttled/i);
  });
});
