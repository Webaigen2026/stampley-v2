import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import {
  CODED_EXPORT_MAX_ROWS,
  GENERIC_EXPORT_FILTER_ERROR,
  GENERIC_EXPORT_LIMIT_ERROR,
  codedStudyId,
  parseCodedExportFilters,
} from "./admin-export-filters"
import { codedAffectBand, codedStressBand } from "./admin-coded-scores"
import { toAffectBand, toStressBand } from "./stampley-openai-context"
import { buildCsv, exportFilename } from "./admin-csv-format"
import { csvFileResponse, respondWithAuditedCsv } from "./admin-export-response"
import { sanitizeAuditMetadata } from "./audit-metadata"
import {
  CHECK_IN_EXPORT_HEADERS,
  HIGH_STRESS_EXPORT_HEADERS,
  STAMPLEY_SESSION_EXPORT_HEADERS,
} from "./admin-export-filters"
import { hasCapability } from "./admin-capabilities"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, "..")

function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8")
}

describe("HIPAA-4 coded export authorization", () => {
  it("allows coordinator and admin coded exports, rejects reviewer", () => {
    assert.equal(hasCapability("STUDY_COORDINATOR", "canExportCodedResearchData"), true)
    assert.equal(hasCapability("ADMIN", "canExportCodedResearchData"), true)
    assert.equal(hasCapability("CLINICAL_REVIEWER", "canExportCodedResearchData"), false)
    assert.equal(hasCapability("PARTICIPANT", "canExportCodedResearchData"), false)
    assert.match(read("lib/admin-csv-export.ts"), /requireCodedExportApi/)
    assert.match(
      read("app/api/admin/analytics/check-ins/export/route.ts"),
      /requireCodedExportApi/
    )
  })
})

describe("HIPAA-4 coded export columns", () => {
  it("uses approved coded columns and no email, UUID, contact, or free text", () => {
    assert.deepEqual([...CHECK_IN_EXPORT_HEADERS], [
      "study_id",
      "check_in_date",
      "stress_band",
      "mood_band",
      "energy_band",
      "domain",
      "subscale",
      "week_number",
      "day_number",
      "needs_safety_escalation",
      "created_at",
    ])
    assert.deepEqual([...HIGH_STRESS_EXPORT_HEADERS], [
      "study_id",
      "check_in_date",
      "stress_band",
      "mood_band",
      "energy_band",
      "domain",
      "subscale",
      "needs_safety_escalation",
      "consecutive_high_distress_days",
      "created_at",
    ])
    assert.deepEqual([...STAMPLEY_SESSION_EXPORT_HEADERS], [
      "study_id",
      "domain",
      "stress_band",
      "mood_band",
      "energy_band",
      "user_message_count",
      "assistant_message_count",
      "created_at",
    ])

    const forbidden = [
      "user_email",
      "email",
      "user_id",
      "id",
      "check_in_submission_id",
      "summary",
      "reflection",
      "coping",
      "contact_name",
      "contact_email",
      "contact_phone",
      "stress_level",
      "distress",
      "mood",
      "energy",
    ]
    const all = [
      ...CHECK_IN_EXPORT_HEADERS,
      ...HIGH_STRESS_EXPORT_HEADERS,
      ...STAMPLEY_SESSION_EXPORT_HEADERS,
    ]
    for (const header of forbidden) {
      assert.equal(all.includes(header as never), false, header)
    }

    const csv = buildCsv(
      [...CHECK_IN_EXPORT_HEADERS],
      [[
        codedStudyId(null),
        "2026-01-02",
        codedStressBand(9),
        codedAffectBand(2),
        codedAffectBand(8),
        "Emotional",
        "Worry",
        1,
        2,
        "true",
        "2026-01-02T00:00:00.000Z",
      ]]
    )
    assert.doesNotMatch(csv, /@|participant-|uuid|I feel|summary/i)
    assert.match(csv, /UNASSIGNED/)
    assert.match(csv, /very_high/)
    assert.equal(codedStudyId("AIDES-ABC123"), "AIDES-ABC123")
    assert.equal(codedStudyId("  "), "UNASSIGNED")
  })

  it("reuses HIPAA-2 band thresholds and omits exact scores", () => {
    assert.equal(codedStressBand(3), toStressBand(3))
    assert.equal(codedStressBand(6), toStressBand(6))
    assert.equal(codedStressBand(8), toStressBand(8))
    assert.equal(codedStressBand(9), toStressBand(9))
    assert.equal(codedAffectBand(3), toAffectBand(3))
    assert.equal(codedAffectBand(7), toAffectBand(7))
    assert.equal(codedAffectBand(8), toAffectBand(8))
    assert.equal(codedStressBand(9), "very_high")
    assert.notEqual(codedStressBand(9), "9")
    assert.equal(codedAffectBand(null), "")
  })

  it("uses a PHI-free filename and no-store headers", () => {
    const filename = exportFilename("stampley-check-ins")
    assert.match(filename, /^stampley-check-ins-\d{4}-\d{2}-\d{2}\.csv$/)
    assert.doesNotMatch(filename, /@|AIDES-|participant/i)
    const response = csvFileResponse("study_id\nUNASSIGNED", filename)
    assert.equal(response.headers.get("Cache-Control"), "no-store")
    assert.equal(response.headers.get("Pragma"), "no-cache")
    assert.equal(response.headers.get("Expires"), "0")
    assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff")
    assert.equal(
      response.headers.get("Content-Type"),
      "text/csv; charset=utf-8"
    )
    assert.equal(
      response.headers.get("Content-Disposition"),
      `attachment; filename="${filename}"`
    )
  })
})

describe("HIPAA-4 export filter validation", () => {
  it("rejects malformed dates, inverted ranges, and unsupported filters", () => {
    assert.equal(
      parseCodedExportFilters(new URLSearchParams("from=2026-13-40")).ok,
      false
    )
    assert.equal(
      parseCodedExportFilters(
        new URLSearchParams("from=2026-02-10&to=2026-02-01")
      ).ok,
      false
    )
    assert.equal(
      parseCodedExportFilters(new URLSearchParams("domain=NotADomain")).ok,
      false
    )
    assert.equal(
      parseCodedExportFilters(new URLSearchParams("week=9")).ok,
      false
    )
    assert.equal(
      parseCodedExportFilters(new URLSearchParams("highStress=maybe")).ok,
      false
    )
    const valid = parseCodedExportFilters(
      new URLSearchParams("from=2026-01-01&to=2026-01-31&domain=Emotional&week=2")
    )
    assert.equal(valid.ok, true)
    assert.equal(CODED_EXPORT_MAX_ROWS, 10_000)
    assert.match(GENERIC_EXPORT_FILTER_ERROR, /Invalid export filters/)
    assert.match(GENERIC_EXPORT_LIMIT_ERROR, /10000/)
    for (const file of [
      "app/api/admin/analytics/check-ins/export/route.ts",
      "app/api/admin/analytics/high-stress/export/route.ts",
      "app/api/admin/analytics/stampley-sessions/export/route.ts",
    ]) {
      const source = read(file)
      assert.match(source, /CODED_EXPORT_MAX_ROWS \+ 1/)
      assert.match(source, /GENERIC_EXPORT_LIMIT_ERROR/)
      assert.match(source, /identified: false/)
      assert.match(source, /exportMode: "CODED"/)
    }
  })

  it("keeps HIPAA-3 fail-closed export audit metadata PHI-free", () => {
    const metadata = sanitizeAuditMetadata({
      filterKeys: ["from", "q"],
      rowCount: 2,
      identified: false,
      exportMode: "CODED",
    })
    assert.deepEqual(metadata, {
      filterKeys: ["from", "q"],
      rowCount: 2,
      identified: false,
      exportMode: "CODED",
    })
    assert.throws(() =>
      sanitizeAuditMetadata({ exportMode: "IDENTIFIED" })
    )
    assert.throws(() =>
      sanitizeAuditMetadata({ email: "participant@example.com" })
    )
  })

  it("audit failure still blocks the CSV", async () => {
    const response = await respondWithAuditedCsv({
      persistAudit: async () => {
        throw new Error("persist failed")
      },
      csv: "study_id\nAIDES-SECRET",
      filename: "stampley-check-ins.csv",
    })
    assert.equal(response.status, 500)
    assert.equal(response.headers.get("Content-Disposition"), null)
    const body = await response.text()
    assert.doesNotMatch(body, /AIDES-SECRET/)
  })
})
