import {
  LOGIN_THROTTLE_IP_MAX,
  LOGIN_THROTTLE_PAIR_MAX,
  deriveLoginIpHash,
  dummyPasswordCompare,
  isFixedWindowExhausted,
  verifyPassword,
  type LoginThrottleStore,
} from "@/lib/auth-throttle";

export type AuthUserRecord = {
  id: string;
  email: string;
  role: "ADMIN" | "STUDY_COORDINATOR" | "CLINICAL_REVIEWER" | "PARTICIPANT";
  password: string;
  authVersion: number;
};

export type AuthUserLookup = {
  findByEmail(email: string): Promise<AuthUserRecord | null>;
};

export type PasswordVerifier = {
  compare(password: string, passwordHash: string): Promise<boolean>;
  dummyCompare(password: string): Promise<void>;
};

export type AuthorizeCredentialsInput = {
  email: string;
  password: string;
  request?: Request;
  users: AuthUserLookup;
  throttles: LoginThrottleStore;
  now?: Date;
  hmacSecret?: string;
  verifier?: PasswordVerifier;
};

const defaultVerifier: PasswordVerifier = {
  compare: verifyPassword,
  dummyCompare: dummyPasswordCompare,
};

async function failOpenRead<T>(
  label: "read" | "persist" | "clear",
  operation: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await operation();
  } catch {
    if (label === "clear") {
      console.error("[auth] login throttle clear failed");
    } else if (label === "persist") {
      console.error("[auth] login throttle persist failed");
    } else {
      console.error("[auth] login throttle read failed");
    }
    return fallback;
  }
}

export async function authorizeCredentials(
  input: AuthorizeCredentialsInput,
): Promise<{
  id: string;
  email: string;
  role: AuthUserRecord["role"];
  authVersion: number;
} | null> {
  const now = input.now ?? new Date();
  const verifier = input.verifier ?? defaultVerifier;
  const ipHash = deriveLoginIpHash(input.request, input.hmacSecret);

  const ipRow = await failOpenRead(
    "read",
    () => input.throttles.getIpThrottle(ipHash),
    null,
  );
  if (isFixedWindowExhausted(ipRow, now, LOGIN_THROTTLE_IP_MAX)) {
    await verifier.dummyCompare(input.password);
    return null;
  }

  const user = await input.users.findByEmail(input.email);
  if (!user?.password) {
    await verifier.dummyCompare(input.password);
    await failOpenRead(
      "persist",
      () => input.throttles.recordIpFailure(ipHash, now),
      undefined,
    );
    return null;
  }

  const pairRow = await failOpenRead(
    "read",
    () => input.throttles.getPairThrottle(user.id, ipHash),
    null,
  );
  if (isFixedWindowExhausted(pairRow, now, LOGIN_THROTTLE_PAIR_MAX)) {
    await verifier.dummyCompare(input.password);
    return null;
  }

  const isValid = await verifier.compare(input.password, user.password);
  if (!isValid) {
    await failOpenRead(
      "persist",
      async () => {
        await input.throttles.recordPairFailure(user.id, ipHash, now);
        await input.throttles.recordIpFailure(ipHash, now);
      },
      undefined,
    );
    return null;
  }

  await failOpenRead(
    "clear",
    () => input.throttles.clearUserPairThrottles(user.id),
    undefined,
  );

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    authVersion: user.authVersion,
  };
}
