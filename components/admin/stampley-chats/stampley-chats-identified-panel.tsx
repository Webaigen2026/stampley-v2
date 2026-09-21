"use client"

import { IdentifiedSearchResults } from "@/components/admin/identified-search-results"
import { StampleySessionCard } from "@/components/admin/stampley-chats/stampley-session-card"
import { searchAdminStampleyChats } from "@/actions/admin-identified-search"
import type { UrlSafeAnalyticsFilters } from "@/lib/admin-analytics-url"
import type { AdminStampleySessionListItem } from "@/lib/admin-stampley-sessions"

function SessionList({
  sessions,
}: {
  sessions: AdminStampleySessionListItem[]
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">Saved sessions</h2>
        <p className="text-xs text-slate-500">
          {sessions.length} session{sessions.length === 1 ? "" : "s"}
          {sessions.length >= 200 ? " (most recent 200)" : ""}
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-700">
            No Stampley chat sessions saved yet.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Sessions appear here after participants complete Step 5 and save
            their check-in.
          </p>
        </div>
      ) : (
        sessions.map((session) => (
          <StampleySessionCard key={session.id} session={session} />
        ))
      )}
    </section>
  )
}

export function StampleyChatsIdentifiedPanel({
  initial,
  urlFilters,
}: {
  initial: AdminStampleySessionListItem[]
  urlFilters: UrlSafeAnalyticsFilters
}) {
  return (
    <IdentifiedSearchResults
      placeholder="Participant email"
      initial={initial}
      search={(q) =>
        searchAdminStampleyChats({
          q,
          from: urlFilters.from,
          to: urlFilters.to,
          domain: urlFilters.domain,
          week: urlFilters.week,
          highStress: urlFilters.highStress,
        })
      }
    >
      {(sessions) => <SessionList sessions={sessions} />}
    </IdentifiedSearchResults>
  )
}
