export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { handlers } from "@/lib/auth";
import { withSensitiveAuthResponse } from "@/lib/sensitive-cache-headers";

export async function GET(...args: Parameters<typeof handlers.GET>) {
  const response = await handlers.GET(...args);
  return withSensitiveAuthResponse(response);
}

export async function POST(...args: Parameters<typeof handlers.POST>) {
  const response = await handlers.POST(...args);
  return withSensitiveAuthResponse(response);
}
