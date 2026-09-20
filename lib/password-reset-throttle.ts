import crypto from "crypto";
import { resolveAuthSecret } from "@/lib/auth.config";
import {
  extractClientIp,
  hashClientIp,
  isFixedWindowExhausted,
  type LoginThrottleRow,
} from "@/lib/auth-throttle";

export const PASSWORD_RESET_IP_WINDOW_MS = 15 * 60 * 1000;
export const PASSWORD_RESET_IP_MAX = 20;
export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export const PASSWORD_RESET_GENERIC_SUCCESS = { success: true as const };
export const PASSWORD_RESET_EMAIL_REQUIRED = {
  error: "Email is required" as const,
};

export type PasswordResetIpThrottleRow = LoginThrottleRow;

export type PasswordResetIpThrottleStore = {
  getIpThrottle(ipHash: string): Promise<PasswordResetIpThrottleRow | null>;
  recordIpRequest(ipHash: string, now: Date): Promise<void>;
};

export type IssuedPasswordResetToken =
  | { kind: "missing" }
  | { kind: "held" }
  | { kind: "created"; plaintextToken: string; tokenId: string };

export type PasswordResetTokenIssuer = {
  issueForUser(userId: string, now: Date): Promise<IssuedPasswordResetToken>;
};

export type PasswordResetUserLookup = {
  findByEmail(email: string): Promise<{ id: string } | null>;
};

export type PasswordResetRequestDeps = {
  users: PasswordResetUserLookup;
  tokens: PasswordResetTokenIssuer;
  ipThrottle: PasswordResetIpThrottleStore | null;
  sendEmail: (email: string, token: string) => Promise<void>;
  deleteTokenById: (tokenId: string) => Promise<void>;
  now?: Date;
  hmacSecret?: string | null;
  headers?: { get(name: string): string | null };
  dummyCrypto?: () => void;
};

export function normalizePasswordResetEmail(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw) return null;
  const normalized = raw.trim().toLowerCase();
  return normalized || null;
}

export function dummyPasswordResetCrypto(): void {
  const discarded = crypto.randomBytes(32).toString("hex");
  crypto.createHash("sha256").update(discarded).digest("hex");
}

export function createPasswordResetTokenMaterial(now: Date): {
  plaintextToken: string;
  tokenHash: string;
  expiresAt: Date;
} {
  const plaintextToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto
    .createHash("sha256")
    .update(plaintextToken)
    .digest("hex");
  return {
    plaintextToken,
    tokenHash,
    expiresAt: new Date(now.getTime() + PASSWORD_RESET_TOKEN_TTL_MS),
  };
}

function headersAsRequest(headerList: {
  get(name: string): string | null;
}): Request {
  const forwarded = headerList.get("x-forwarded-for") ?? "";
  const realIp = headerList.get("x-real-ip") ?? "";
  const headers = new Headers();
  if (forwarded) headers.set("x-forwarded-for", forwarded);
  if (realIp) headers.set("x-real-ip", realIp);
  return new Request("https://localhost/", { headers });
}

export function resolvePasswordResetHmacSecret(
  explicit?: string | null,
): string | null {
  if (explicit === null) return null;
  if (typeof explicit === "string") {
    const trimmed = explicit.trim();
    return trimmed || null;
  }
  return resolveAuthSecret() ?? null;
}

export function derivePasswordResetIpHash(
  headerList: { get(name: string): string | null } | undefined,
  explicitSecret?: string | null,
): string | null {
  const secret = resolvePasswordResetHmacSecret(explicitSecret);
  if (!secret) {
    console.error("[auth] password reset throttle unavailable");
    return null;
  }
  const ip = extractClientIp(
    headerList ? headersAsRequest(headerList) : undefined,
  );
  return hashClientIp(ip, secret);
}

type PrismaPasswordResetIpClient = {
  passwordResetIpThrottle: {
    findUnique: (args: {
      where: { ipHash: string };
    }) => Promise<PasswordResetIpThrottleRow | null>;
  };
  $executeRaw: (
    query: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<unknown>;
};

export function createPrismaPasswordResetIpThrottleStore(
  db: PrismaPasswordResetIpClient,
): PasswordResetIpThrottleStore {
  return {
    async getIpThrottle(ipHash) {
      return db.passwordResetIpThrottle.findUnique({ where: { ipHash } });
    },
    async recordIpRequest(ipHash, now) {
      const cutoff = new Date(now.getTime() - PASSWORD_RESET_IP_WINDOW_MS);
      await db.$executeRaw`
        INSERT INTO "password_reset_ip_throttles" ("id", "ip_hash", "window_start", "attempt_count")
        VALUES (gen_random_uuid()::text, ${ipHash}, ${now}, 1)
        ON CONFLICT ("ip_hash")
        DO UPDATE SET
          "attempt_count" = CASE
            WHEN "password_reset_ip_throttles"."window_start" > ${cutoff}
            THEN "password_reset_ip_throttles"."attempt_count" + 1
            ELSE 1
          END,
          "window_start" = CASE
            WHEN "password_reset_ip_throttles"."window_start" > ${cutoff}
            THEN "password_reset_ip_throttles"."window_start"
            ELSE ${now}
          END
      `;
    },
  };
}

type PrismaTokenIssueClient = {
  $transaction: <T>(
    fn: (tx: PrismaTokenIssueTransaction) => Promise<T>,
  ) => Promise<T>;
};

type PrismaTokenIssueTransaction = {
  $queryRaw: <T = unknown>(
    query: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<T>;
  passwordResetToken: {
    findFirst: (args: {
      where: { userId: string; expiresAt: { gt: Date } };
      select: { id: true };
    }) => Promise<{ id: string } | null>;
    create: (args: {
      data: { userId: string; tokenHash: string; expiresAt: Date };
      select: { id: true };
    }) => Promise<{ id: string }>;
  };
};

export function createPrismaPasswordResetTokenIssuer(
  db: PrismaTokenIssueClient,
): PasswordResetTokenIssuer {
  return {
    async issueForUser(userId, now) {
      return db.$transaction(async (tx) => {
        const locked = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM "users" WHERE id = ${userId} FOR UPDATE
        `;
        if (locked.length === 0) return { kind: "missing" };

        const existing = await tx.passwordResetToken.findFirst({
          where: { userId, expiresAt: { gt: now } },
          select: { id: true },
        });
        if (existing) return { kind: "held" };

        const material = createPasswordResetTokenMaterial(now);
        const created = await tx.passwordResetToken.create({
          data: {
            userId,
            tokenHash: material.tokenHash,
            expiresAt: material.expiresAt,
          },
          select: { id: true },
        });
        return {
          kind: "created",
          plaintextToken: material.plaintextToken,
          tokenId: created.id,
        };
      });
    },
  };
}

async function failOpenThrottle<T>(
  label: "read" | "persist",
  operation: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await operation();
  } catch {
    if (label === "persist") {
      console.error("[auth] password reset throttle persist failed");
    } else {
      console.error("[auth] password reset throttle read failed");
    }
    return fallback;
  }
}

export async function executePasswordResetRequest(
  rawEmail: unknown,
  deps: PasswordResetRequestDeps,
): Promise<{ success: true } | { error: string }> {
  const email = normalizePasswordResetEmail(rawEmail);
  if (!email) return PASSWORD_RESET_EMAIL_REQUIRED;

  const now = deps.now ?? new Date();
  const dummy = deps.dummyCrypto ?? dummyPasswordResetCrypto;
  const ipHash = derivePasswordResetIpHash(deps.headers, deps.hmacSecret);

  if (ipHash && deps.ipThrottle) {
    const ipRow = await failOpenThrottle(
      "read",
      () => deps.ipThrottle!.getIpThrottle(ipHash),
      null,
    );
    if (
      isFixedWindowExhausted(
        ipRow,
        now,
        PASSWORD_RESET_IP_MAX,
        PASSWORD_RESET_IP_WINDOW_MS,
      )
    ) {
      dummy();
      return PASSWORD_RESET_GENERIC_SUCCESS;
    }
  }

  const user = await deps.users.findByEmail(email);
  if (!user) {
    dummy();
    if (ipHash && deps.ipThrottle) {
      await failOpenThrottle(
        "persist",
        () => deps.ipThrottle!.recordIpRequest(ipHash, now),
        undefined,
      );
    }
    return PASSWORD_RESET_GENERIC_SUCCESS;
  }

  const issued = await deps.tokens.issueForUser(user.id, now);
  if (issued.kind === "missing") {
    dummy();
    if (ipHash && deps.ipThrottle) {
      await failOpenThrottle(
        "persist",
        () => deps.ipThrottle!.recordIpRequest(ipHash, now),
        undefined,
      );
    }
    return PASSWORD_RESET_GENERIC_SUCCESS;
  }

  if (issued.kind === "created") {
    try {
      await deps.sendEmail(email, issued.plaintextToken);
    } catch {
      console.error("[auth] password reset email failed");
      try {
        await deps.deleteTokenById(issued.tokenId);
      } catch {
        console.error("[auth] password reset email failed");
      }
    }
  }

  if (ipHash && deps.ipThrottle) {
    await failOpenThrottle(
      "persist",
      () => deps.ipThrottle!.recordIpRequest(ipHash, now),
      undefined,
    );
  }

  return PASSWORD_RESET_GENERIC_SUCCESS;
}
