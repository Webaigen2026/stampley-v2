"use client"

import PageTransition from "@/components/navigation/PageTransition"
import StepDock from "@/components/navigation/StepDock"
import {
  CheckInSubmitProvider,
  useCheckInSubmit,
} from "@/components/check-in/CheckInSubmitContext"
import WeeklyDomainSync from "@/components/check-in/WeeklyDomainSync"
import { CheckInDraftOwnerSync } from "@/components/check-in/CheckInDraftOwnerSync"

function CheckInFooterDock() {
  const { meta } = useCheckInSubmit()

  if (meta.submitted || meta.checkInSaved) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30">
      <div
        className="
          pointer-events-auto
          px-5
          py-4
          sm:px-8
          lg:pr-30
        "
      >
        <div className="mx-auto flex justify-end">
          <StepDock />
        </div>
      </div>
    </div>
  )
}

export default function CheckInShell({ children }: { children: React.ReactNode }) {
  return (
    <CheckInSubmitProvider>
      <CheckInDraftOwnerSync />
      <WeeklyDomainSync />
      <PageTransition>{children}</PageTransition>
      <CheckInFooterDock />
    </CheckInSubmitProvider>
  )
}
