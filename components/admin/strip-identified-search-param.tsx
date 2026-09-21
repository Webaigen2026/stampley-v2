"use client"

import { useLayoutEffect } from "react"
import { ADMIN_IDENTIFIED_SEARCH_PARAM } from "@/lib/admin-identified-search"

/** Removes leftover bookmark/history `q` from the address bar without applying it. */
export function StripIdentifiedSearchParam() {
  useLayoutEffect(() => {
    const url = new URL(window.location.href)
    if (!url.searchParams.has(ADMIN_IDENTIFIED_SEARCH_PARAM)) return
    url.searchParams.delete(ADMIN_IDENTIFIED_SEARCH_PARAM)
    const qs = url.searchParams.toString()
    const next = `${url.pathname}${qs ? `?${qs}` : ""}${url.hash}`
    window.history.replaceState(window.history.state, "", next)
  }, [])

  return null
}
