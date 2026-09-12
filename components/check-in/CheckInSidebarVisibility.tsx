"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"
import CollapsibleSidebar from "./CollapsibleSidebar"

type CheckInSidebarVisibilityValue = {
  hideOuterSidebar: boolean
  setHideOuterSidebar: (hide: boolean) => void
}

const CheckInSidebarVisibilityContext =
  createContext<CheckInSidebarVisibilityValue | null>(null)

export function CheckInSidebarVisibilityProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [hideOuterSidebar, setHideOuterSidebarState] = useState(false)

  const setHideOuterSidebar = useCallback((hide: boolean) => {
    setHideOuterSidebarState(hide)
  }, [])

  const value = useMemo(
    () => ({ hideOuterSidebar, setHideOuterSidebar }),
    [hideOuterSidebar, setHideOuterSidebar]
  )

  return (
    <CheckInSidebarVisibilityContext.Provider value={value}>
      {children}
    </CheckInSidebarVisibilityContext.Provider>
  )
}

export function useCheckInSidebarVisibility() {
  const ctx = useContext(CheckInSidebarVisibilityContext)
  if (!ctx) {
    throw new Error(
      "useCheckInSidebarVisibility must be used within CheckInSidebarVisibilityProvider"
    )
  }
  return ctx
}

export function CheckInOuterSidebar() {
  const { hideOuterSidebar } = useCheckInSidebarVisibility()
  if (hideOuterSidebar) return null
  return <CollapsibleSidebar />
}
