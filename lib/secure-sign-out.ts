import { clearSensitiveClientState } from "@/lib/clear-sensitive-client-state"

export type SecureSignOutFn = (args: { callbackUrl: string }) => unknown

export async function secureSignOut(
  options: { callbackUrl: string },
  signOutImpl: SecureSignOutFn
): Promise<void> {
  clearSensitiveClientState()
  await signOutImpl({ callbackUrl: options.callbackUrl })
}
