import crypto from "crypto";
import bcrypt from "bcryptjs";
import { resolveAuthSecret } from "@/lib/auth.config";

export const LOGIN_THROTTLE_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_THROTTLE_PAIR_MAX = 8;
export const LOGIN_THROTTLE_IP_MAX = 40;

const UNKNOWN_IP_BUCKET = "unknown";

/**
 * Valid bcrypt cost-10 hash of a non-user secret. Used only for dummy
 * comparisons on unknown-email and throttled paths. The compare result is
 * ignored; this exists to keep those paths close to real password timing.
 */
export const LOGIN_DUMMY_BCRYPT_HASH =
  "$2b$10$Z3era5xXcmXpC2gx/gJdge6ArUe4CkVBWJa23p0TkoVtryMJXUTGO";

export type LoginThrottleRow = {
  windowStart: Date;
  attemptCount: number;
};

export type LoginThrottleStore = {
  getIpThrottle(ipHash: string): Promise<LoginThrottleRow | null>;
  getPairThrottle(
    userId: string,
    ipHash: string,
  ): Promise<LoginThrottleRow | null>;
  recordIpFailure(ipHash: string, now: Date): Promise<void>;
  recordPairFailure(
    userId: string,
    ipHash: string,
    now: Date,
  ): Promise<void>;
  clearUserPairThrottles(userId: string): Promise<void>;
};

export type PrismaLoginThrottleClient = {
  loginThrottle: {
    findUnique: (args: {
      where: { userId_ipHash: { userId: string; ipHash: string } };
    }) => Promise<LoginThrottleRow | null>;
    deleteMany: (args: { where: { userId: string } }) => Promise<unknown>;
  };
  loginIpThrottle: {
    findUnique: (args: {
      where: { ipHash: string };
    }) => Promise<LoginThrottleRow | null>;
  };
  $executeRaw: (
    query: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<unknown>;
};

export function extractClientIp(request?: Request): string {
  if (!request) return UNKNOWN_IP_BUCKET;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return normalizeIp(first);
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return normalizeIp(realIp);

  return UNKNOWN_IP_BUCKET;
}

function normalizeIp(raw: string): string {
  const ip = raw.trim().toLowerCase();
  if (!ip) return UNKNOWN_IP_BUCKET;
  if (ip.startsWith("::ffff:")) {
    const mapped = ip.slice("::ffff:".length).trim();
    return mapped || UNKNOWN_IP_BUCKET;
  }
  return ip;
}

export function hashClientIp(normalizedIp: string, secret?: string): string {
  const key = secret ?? resolveAuthSecret() ?? "";
  return crypto
    .createHmac("sha256", key)
    .update(normalizedIp, "utf8")
    .digest("hex");
}

export function deriveLoginIpHash(
  request?: Request,
  secret?: string,
): string {
  return hashClientIp(extractClientIp(request), secret);
}

export function isFixedWindowExhausted(
  row: LoginThrottleRow | null,
  now: Date,
  maxAttempts: number,
  windowMs: number = LOGIN_THROTTLE_WINDOW_MS,
): boolean {
  if (!row) return false;
  if (now.getTime() - row.windowStart.getTime() >= windowMs) return false;
  return row.attemptCount >= maxAttempts;
}

/**
 * Pure fixed-window increment. PostgreSQL INSERT ... ON CONFLICT in
 * createPrismaLoginThrottleStore applies the same rules under a row lock.
 */
export function applyFixedWindowFailure(
  row: LoginThrottleRow | null,
  now: Date,
  windowMs: number = LOGIN_THROTTLE_WINDOW_MS,
): LoginThrottleRow {
  if (!row || now.getTime() - row.windowStart.getTime() >= windowMs) {
    return { windowStart: now, attemptCount: 1 };
  }
  return {
    windowStart: row.windowStart,
    attemptCount: row.attemptCount + 1,
  };
}

export async function dummyPasswordCompare(password: string): Promise<void> {
  await bcrypt.compare(password, LOGIN_DUMMY_BCRYPT_HASH);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

function windowCutoff(now: Date): Date {
  return new Date(now.getTime() - LOGIN_THROTTLE_WINDOW_MS);
}

export function createPrismaLoginThrottleStore(
  db: PrismaLoginThrottleClient,
): LoginThrottleStore {
  return {
    async getIpThrottle(ipHash) {
      return db.loginIpThrottle.findUnique({ where: { ipHash } });
    },
    async getPairThrottle(userId, ipHash) {
      return db.loginThrottle.findUnique({
        where: { userId_ipHash: { userId, ipHash } },
      });
    },
    async recordIpFailure(ipHash, now) {
      const cutoff = windowCutoff(now);
      await db.$executeRaw`
        INSERT INTO "login_ip_throttles" ("id", "ip_hash", "window_start", "attempt_count")
        VALUES (gen_random_uuid()::text, ${ipHash}, ${now}, 1)
        ON CONFLICT ("ip_hash")
        DO UPDATE SET
          "attempt_count" = CASE
            WHEN "login_ip_throttles"."window_start" > ${cutoff}
            THEN "login_ip_throttles"."attempt_count" + 1
            ELSE 1
          END,
          "window_start" = CASE
            WHEN "login_ip_throttles"."window_start" > ${cutoff}
            THEN "login_ip_throttles"."window_start"
            ELSE ${now}
          END
      `;
    },
    async recordPairFailure(userId, ipHash, now) {
      const cutoff = windowCutoff(now);
      await db.$executeRaw`
        INSERT INTO "login_throttles" ("id", "user_id", "ip_hash", "window_start", "attempt_count")
        VALUES (gen_random_uuid()::text, ${userId}, ${ipHash}, ${now}, 1)
        ON CONFLICT ("user_id", "ip_hash")
        DO UPDATE SET
          "attempt_count" = CASE
            WHEN "login_throttles"."window_start" > ${cutoff}
            THEN "login_throttles"."attempt_count" + 1
            ELSE 1
          END,
          "window_start" = CASE
            WHEN "login_throttles"."window_start" > ${cutoff}
            THEN "login_throttles"."window_start"
            ELSE ${now}
          END
      `;
    },
    async clearUserPairThrottles(userId) {
      await db.loginThrottle.deleteMany({ where: { userId } });
    },
  };
}

export type PasswordResetTransaction = {
  passwordResetToken: {
    findFirst: (args: {
      where: {
        tokenHash: string;
        expiresAt: { gt: Date };
      };
    }) => Promise<{ id: string; userId: string } | null>;
    deleteMany: (args: {
      where: {
        id: string;
        tokenHash: string;
        expiresAt: { gt: Date };
      };
    }) => Promise<{ count: number }>;
  };
  user: {
    updateMany: (args: {
      where: { id: string };
      data: {
        password: string;
        authVersion: { increment: number };
      };
    }) => Promise<unknown>;
  };
  loginThrottle: {
    deleteMany: (args: { where: { userId: string } }) => Promise<unknown>;
  };
};

export class PasswordResetRejected extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PasswordResetRejected";
  }
}

export async function applyVerifiedPasswordReset(
  tx: PasswordResetTransaction,
  args: { tokenHash: string; hashedPassword: string; now?: Date },
): Promise<void> {
  const now = args.now ?? new Date();
  const tokenRow = await tx.passwordResetToken.findFirst({
    where: {
      tokenHash: args.tokenHash,
      expiresAt: { gt: now },
    },
  });

  if (!tokenRow) {
    throw new PasswordResetRejected(
      "Reset link is invalid or has expired. Please request a new one.",
    );
  }

  const consumed = await tx.passwordResetToken.deleteMany({
    where: {
      id: tokenRow.id,
      tokenHash: args.tokenHash,
      expiresAt: { gt: now },
    },
  });

  if (consumed.count !== 1) {
    throw new PasswordResetRejected(
      "Reset link is invalid or has expired. Please request a new one.",
    );
  }

  await tx.user.updateMany({
    where: { id: tokenRow.userId },
    data: {
      password: args.hashedPassword,
      authVersion: { increment: 1 },
    },
  });

  await tx.loginThrottle.deleteMany({
    where: { userId: tokenRow.userId },
  });
}
