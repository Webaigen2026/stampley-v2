import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PasswordResetRejected,
  applyVerifiedPasswordReset,
  type PasswordResetTransaction,
} from "./auth-throttle";

type TokenRow = { id: string; userId: string; tokenHash: string; expiresAt: Date };

function createResetDb(initial: {
  token: TokenRow | null;
  user: { id: string; password: string; authVersion: number };
}) {
  const tokens = new Map<string, TokenRow>();
  if (initial.token) tokens.set(initial.token.id, initial.token);
  const pairThrottles = new Map<string, number>([
    [`${initial.user.id}\0ip-a`, 5],
    [`${initial.user.id}\0ip-b`, 2],
    ["other-user\0ip-a", 4],
  ]);
  const user = { ...initial.user };

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
        if (
          !row ||
          row.tokenHash !== args.where.tokenHash ||
          row.expiresAt.getTime() <= args.where.expiresAt.gt.getTime()
        ) {
          return { count: 0 };
        }
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
          if (key.startsWith(`${args.where.userId}\0`)) pairThrottles.delete(key);
        }
      },
    },
  };

  return { tx, tokens, pairThrottles, user };
}

describe("applyVerifiedPasswordReset", () => {
  const now = new Date("2026-09-20T19:00:00.000Z");

  it("updates the password, increments authVersion, consumes the token, and clears LoginThrottle rows", async () => {
    const db = createResetDb({
      token: {
        id: "tok-1",
        userId: "user-1",
        tokenHash: "hash-1",
        expiresAt: new Date(now.getTime() + 60_000),
      },
      user: { id: "user-1", password: "old-hash", authVersion: 2 },
    });

    await applyVerifiedPasswordReset(db.tx, {
      tokenHash: "hash-1",
      hashedPassword: "new-hash",
      now,
    });

    assert.equal(db.user.password, "new-hash");
    assert.equal(db.user.authVersion, 3);
    assert.equal(db.tokens.size, 0);
    assert.equal(db.pairThrottles.has("user-1\0ip-a"), false);
    assert.equal(db.pairThrottles.has("user-1\0ip-b"), false);
    assert.equal(db.pairThrottles.get("other-user\0ip-a"), 4);
  });

  it("rejects an expired or missing token without changing auth state", async () => {
    const db = createResetDb({
      token: {
        id: "tok-1",
        userId: "user-1",
        tokenHash: "hash-1",
        expiresAt: new Date(now.getTime() - 1),
      },
      user: { id: "user-1", password: "old-hash", authVersion: 2 },
    });

    await assert.rejects(
      () =>
        applyVerifiedPasswordReset(db.tx, {
          tokenHash: "hash-1",
          hashedPassword: "new-hash",
          now,
        }),
      PasswordResetRejected,
    );
    assert.equal(db.user.authVersion, 2);
    assert.equal(db.user.password, "old-hash");
    assert.equal(db.pairThrottles.get("user-1\0ip-a"), 5);
  });
});
