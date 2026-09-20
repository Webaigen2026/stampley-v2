export function escapeCsvValue(value: unknown): string {
  if (value == null) return ""
  const str = String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function buildCsv(headers: string[], rows: unknown[][]): string {
  const lines = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ]
  return lines.join("\n")
}

export function exportFilename(prefix: string): string {
  const dateStamp = new Date().toISOString().slice(0, 10)
  return `${prefix}-${dateStamp}.csv`
}
