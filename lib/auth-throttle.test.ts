import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  LOGIN_DUMMY_BCRYPT_HASH,
  LOGIN_THROTTLE_WINDOW_MS,
  applyFixedWindowFailure,
  dummyPasswordCompare,
  extractClientIp,
  hashClientIp,
  isFixedWindowExhausted,
} from "./auth-throttle";
import { MemoryLoginThrottleStore } from "./login-throttle-memory";

describe("login IP hashing", () => {
  it("uses a deterministic unknown bucket when no request is present", () => {
    assert.equal(extractClientIp(), "unknown");
    assert.equal(extractClientIp(new Request("https://example.test/login")), "unknown");
  });

  it("takes the first forwarded hop and hashes with HMAC-SHA-256", () => {
    const request = new Request("https://example.test/login", {
      headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.1" },
    });
    const secret = "test-auth-secret-min-32-chars-long!!";
    const digest = hashClientIp(extractClientIp(request), secret);
    assert.equal(digest.length, 64);
    assert.match(digest, /^[a-f0-9]{64}$/);
    assert.doesNotMatch(digest, /203\.0\.113\.10/);
    assert.equal(digest, hashClientIp("203.0.113.10", secret));
  });
});

describe("dummy bcrypt", () => {
  it("is a cost-10 hash and always fails for a normal password", async () => {
    assert.match(LOGIN_DUMMY_BCRYPT_HASH, /^\$2[aby]\$10\$/);
    const started = Date.now();
    await dummyPasswordCompare("participant-password");
    assert.ok(Date.now() - started >= 0);
  });
});

describe("fixed-window increment", () => {
  const now = new Date("2026-09-20T19:00:00.000Z");

  it("starts a new window when none exists", () => {
    assert.deepEqual(applyFixedWindowFailure(null, now), {
      windowStart: now,
      attemptCount: 1,
    });
  });

  it("increments inside an active window without moving windowStart", () => {
    const row = { windowStart: now, attemptCount: 3 };
    const later = new Date(now.getTime() + 60_000);
    assert.deepEqual(applyFixedWindowFailure(row, later), {
      windowStart: now,
      attemptCount: 4,
    });
  });

  it("resets after the original window expires instead of extending it", () => {
    const row = { windowStart: now, attemptCount: 8 };
    const expired = new Date(now.getTime() + LOGIN_THROTTLE_WINDOW_MS);
    assert.equal(isFixedWindowExhausted(row, expired, 8), false);
    assert.deepEqual(applyFixedWindowFailure(row, expired), {
      windowStart: expired,
      attemptCount: 1,
    });
  });
});

describe("concurrent failure recording", () => {
  it("does not lose ordinary increments under parallel writes", async () => {
    const store = new MemoryLoginThrottleStore();
    const now = new Date("2026-09-20T19:00:00.000Z");
    const userId = "user-1";
    const ipHash = "ip-hash-1";
    await Promise.all(
      Array.from({ length: 25 }, () => store.recordPairFailure(userId, ipHash, now)),
    );
    const row = await store.getPairThrottle(userId, ipHash);
    assert.equal(row?.attemptCount, 25);
    assert.equal(row?.windowStart.getTime(), now.getTime());
  });
});
