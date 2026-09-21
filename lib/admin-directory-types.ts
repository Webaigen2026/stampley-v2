export const PHQ_SEVERITY_OPTIONS = [
  "Minimal",
  "Mild",
  "Moderate",
  "Moderately Severe",
  "Severe",
] as const

export type AdminUserDirectoryRow = {
  id: string
  email: string
  role: string
  study_id: string | null
  created_at: Date | string | null
  pre_survey_completed_at: Date | string | null
  checkin_count: number
}

export type AdminUserDirectoryResult = {
  rows: AdminUserDirectoryRow[]
  totalUsers: number
  page: number
  pageSize: number
  totalPages: number
}

export type AdminKeyDirectoryRow = {
  id: string
  key: string
  is_used: boolean
  created_at: Date | string | null
  participant_email: string | null
}

export type AdminKeyDirectoryResult = {
  rows: AdminKeyDirectoryRow[]
  filteredTotal: number
  page: number
  pageSize: number
  totalPages: number
}
