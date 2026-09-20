import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import {
  appendAuditEvent,
  createAuditRequestId,
  type AuditActor,
  type AuditWriteClient,
} from "./audit"
import {
  AuditMetadataRejected,
  filterKeysFromAnalytics,
  filterKeysFromFlags,
  sanitizeAuditMetadata,
} from "./audit-metadata"
import { actorFromSession, persistExportAuditOrThrow } from "./audit-admin"
import { completePhiPageAccess, GenericAdminFailure } from "./admin-phi-page"
import { respondWithAuditedCsv } from "./admin-export-response"
import {
  recordAdminLoginSucceededFailOpen,
  recordPasswordResetCompletedFailOpen,
} from "./audit-auth-events"
import {
  auditedCreateStudyKey,
  auditedCreateUser,
  auditedDeleteUser,
  auditedToggleUserRole,
} from "./admin-audited-mutations"

const HERE = dirname(fileURLToPath(import.meta.url))

type AuditRow = {
  actorUserId: string | null
  actorRole: string | null
  action: string
  resourceType: string
  resourceId: string | null
  subjectUserId: string | null
  outcome: string
  occurredAt: Date
  requestId: string | null
  metadata: unknown
}

function createAuditStore(options?: { fail?: boolean }) {
  const rows: AuditRow[] = []
  const db: AuditWriteClient = {
    auditLog: {
      async create({ data }) {
        if (options?.fail) {
          throw new Error("persist failed")
        }
        rows.push({ ...(data as AuditRow) })
        return data
      },
    },
  }
  return { db, rows }
}

const admin: AuditActor = { userId: "admin-1", role: "ADMIN" }
const adminSession = { user: { id: "admin-1", role: "ADMIN" as const } }
const participantSession = {
  user: { id: "participant-1", role: "PARTICIPANT" as const },
}

function mutationStore(options?: { failAudit?: boolean }) {
  const users = new Map<
    string,
    { id: string; email: string; password: string; role: string; authVersion: number }
  >()
  const keys = new Map<
    string,
    { id: string; key: string; isUsed: boolean; createdBy: string | null }
  >()
  const audit = createAuditStore({ fail: options?.failAudit })

  const db = {
    ...audit.db,
    user: {
      async create(args: {
        data: { email: string; password: string; role: "ADMIN" | "PARTICIPANT" }
        select: { id: true }
      }) {
        const id = `user-${users.size + 1}`
        users.set(id, {
          id,
          email: args.data.email,
          password: args.data.password,
          role: args.data.role,
          authVersion: 0,
        })
        return { id }
      },
      async deleteMany(args: { where: { id: string } }) {
        if (!users.has(args.where.id)) return { count: 0 }
        users.delete(args.where.id)
        return { count: 1 }
      },
      async updateMany(args: {
        where: { id: string }
        data: { role: "ADMIN" | "PARTICIPANT"; authVersion: { increment: 1 } }
      }) {
        const user = users.get(args.where.id)
        if (!user) return { count: 0 }
        user.role = args.data.role
        user.authVersion += args.data.authVersion.increment
        return { count: 1 }
      },
    },
    studyKey: {
      async create(args: {
        data: { key: string; isUsed: boolean; createdBy: string | null }
        select: { id: true }
      }) {
        const id = `studykey-${keys.size + 1}`
        keys.set(id, { id, ...args.data })
        return { id }
      },
      async deleteMany(args: { where: { id: string; isUsed: false } }) {
        const row = keys.get(args.where.id)
        if (!row || row.isUsed) return { count: 0 }
        keys.delete(args.where.id)
        return { count: 1 }
      },
    },
  }

  return { db, users, keys, rows: audit.rows }
}

async function simulateTransaction<T>(
  store: ReturnType<typeof mutationStore>,
  fn: () => Promise<T>
): Promise<T> {
  const users = structuredClone([...store.users.entries()])
  const keys = structuredClone([...store.keys.entries()])
  const audits = store.rows.slice()
  try {
    return await fn()
  } catch (error) {
    store.users.clear()
    for (const [id, user] of users) store.users.set(id, user)
    store.keys.clear()
    for (const [id, key] of keys) store.keys.set(id, key)
    store.rows.splice(0, store.rows.length, ...audits)
    throw error
  }
}

describe("HIPAA-3 audit service", () => {
  it("exposes no update or delete helpers", () => {
    const source = readFileSync(join(HERE, "audit.ts"), "utf8")
    assert.match(source, /export async function appendAuditEvent/)
    assert.doesNotMatch(source, /function updateAudit|function deleteAudit|function replaceAudit/)
    assert.doesNotMatch(source, /auditLog\.update|auditLog\.delete|auditLog\.upsert/)
  })

  it("generates occurredAt server-side and ignores client actor fields in metadata", async () => {
    const { db, rows } = createAuditStore()
    const before = Date.now()
    await appendAuditEvent(db, admin, {
      action: "ADMIN_SAFETY_VIEWED",
      resourceType: "SAFETY",
      outcome: "SUCCESS",
    })
    const after = Date.now()
    assert.equal(rows.length, 1)
    assert.ok(rows[0].occurredAt instanceof Date)
    assert.ok(rows[0].occurredAt.getTime() >= before)
    assert.ok(rows[0].occurredAt.getTime() <= after)
    assert.equal(rows[0].actorUserId, "admin-1")

    assert.throws(
      () =>
        sanitizeAuditMetadata({
          actorUserId: "spoofed-admin",
          occurredAt: "2020-01-01T00:00:00.000Z",
          outcome: "SUCCESS",
        }),
      AuditMetadataRejected
    )
  })

  it("takes actor identity from the server auth argument, not the client", async () => {
    const { db, rows } = createAuditStore()
    const spoofed = actorFromSession({
      user: { id: "spoofed-from-browser", role: "ADMIN" },
    })
    assert.equal(spoofed?.userId, "spoofed-from-browser")

    await appendAuditEvent(db, admin, {
      action: "ADMIN_USER_DIRECTORY_VIEWED",
      resourceType: "USER_DIRECTORY",
      outcome: "SUCCESS",
    })
    assert.equal(rows[0].actorUserId, "admin-1")
    assert.notEqual(rows[0].actorUserId, "spoofed-from-browser")
  })

  it("creates a random request id that is not derived from email or user id", () => {
    const id = createAuditRequestId()
    assert.match(id, /^[0-9a-f-]{36}$/i)
    assert.doesNotMatch(id, /participant|admin@|reset/i)
  })
})

describe("HIPAA-3 metadata allowlist", () => {
  it("rejects email, transcript, reflection, coping, raw objects, and unknown keys", () => {
    assert.throws(
      () => sanitizeAuditMetadata({ email: "participant@example.com" }),
      AuditMetadataRejected
    )
    assert.throws(
      () => sanitizeAuditMetadata({ transcript: "hello" }),
      AuditMetadataRejected
    )
    assert.throws(
      () => sanitizeAuditMetadata({ reflection: "I feel overwhelmed" }),
      AuditMetadataRejected
    )
    assert.throws(
      () => sanitizeAuditMetadata({ coping: "walked" }),
      AuditMetadataRejected
    )
    assert.throws(() => sanitizeAuditMetadata(["raw"]), AuditMetadataRejected)
    assert.throws(
      () => sanitizeAuditMetadata({ unknownKey: true }),
      AuditMetadataRejected
    )
  })

  it("stores filterKeys names, never values", () => {
    const keys = filterKeysFromAnalytics({
      q: "participant@example.com",
      from: "2026-01-01",
      to: "2026-01-31",
      domain: "Emotional",
      highStress: true,
      week: 2,
    })
    assert.deepEqual(keys, ["from", "to", "domain", "week", "highStress", "q"])
    assert.equal(
      (keys as string[]).includes("participant@example.com"),
      false
    )
    const sanitized = sanitizeAuditMetadata({ filterKeys: keys })
    assert.deepEqual(sanitized?.filterKeys, keys)
    assert.throws(
      () => sanitizeAuditMetadata({ filterKeys: ["participant@example.com"] }),
      AuditMetadataRejected
    )
    assert.deepEqual(filterKeysFromFlags({ q: true, from: false }), ["q"])
  })
})

describe("HIPAA-3 PHI page reads", () => {
  it("authorized participant-profile access creates exactly one SUCCESS event", async () => {
    const { db, rows } = createAuditStore()
    const payload = {
      email: "participant@example.com",
      phq9: 3,
      messages: [{ role: "user", content: "I feel hopeless" }],
    }
    const result = await completePhiPageAccess({
      db,
      session: adminSession,
      action: "ADMIN_PARTICIPANT_PROFILE_VIEWED",
      resourceType: "USER",
      resourceId: "participant-1",
      subjectUserId: "participant-1",
      metadata: { includesPhqItems: true, includesTranscripts: true },
      payload,
    })
    assert.equal(result, payload)
    assert.equal(rows.length, 1)
    assert.equal(rows[0].action, "ADMIN_PARTICIPANT_PROFILE_VIEWED")
    assert.equal(rows[0].outcome, "SUCCESS")
    assert.equal(rows[0].resourceId, "participant-1")
    assert.equal(rows[0].subjectUserId, "participant-1")
    assert.deepEqual(rows[0].metadata, {
      includesPhqItems: true,
      includesTranscripts: true,
    })
  })

  it("unauthorized or non-admin access creates no SUCCESS PHI event", async () => {
    const { db, rows } = createAuditStore()
    const payload = { email: "participant@example.com", reflection: "secret" }
    await assert.rejects(
      () =>
        completePhiPageAccess({
          db,
          session: participantSession,
          action: "ADMIN_PARTICIPANT_PROFILE_VIEWED",
          resourceType: "USER",
          resourceId: "participant-1",
          subjectUserId: "participant-1",
          payload,
        }),
      GenericAdminFailure
    )
    assert.equal(rows.filter((row) => row.outcome === "SUCCESS").length, 0)
    assert.equal(
      rows.filter((row) => row.action === "ADMIN_PARTICIPANT_PROFILE_VIEWED")
        .length,
      0
    )
  })

  it("does not return PHI when audit persistence fails", async () => {
    const { db } = createAuditStore({ fail: true })
    const payload = {
      email: "participant@example.com",
      reflection: "I cannot sleep",
      distress: 9,
    }
    await assert.rejects(
      () =>
        completePhiPageAccess({
          db,
          session: adminSession,
          action: "ADMIN_PARTICIPANT_PROFILE_VIEWED",
          resourceType: "USER",
          resourceId: "participant-1",
          subjectUserId: "participant-1",
          payload,
        }),
      GenericAdminFailure
    )
  })

  it("transcript list audit contains no messages or summary", async () => {
    const { db, rows } = createAuditStore()
    await completePhiPageAccess({
      db,
      session: adminSession,
      action: "ADMIN_STAMPLEY_TRANSCRIPT_LIST_VIEWED",
      resourceType: "STAMPLEY_SESSION",
      metadata: { includesTranscripts: true },
      payload: {
        messages: [{ content: "full transcript text" }],
        summary: "Participant discussed hypoglycemia",
      },
    })
    const serialized = JSON.stringify(rows)
    assert.equal(rows.length, 1)
    assert.doesNotMatch(serialized, /full transcript text|hypoglycemia|messages|summary/i)
    assert.deepEqual(rows[0].metadata, { includesTranscripts: true })
  })

  it("safety audit contains no email, reflection, or distress values", async () => {
    const { db, rows } = createAuditStore()
    await completePhiPageAccess({
      db,
      session: adminSession,
      action: "ADMIN_SAFETY_VIEWED",
      resourceType: "SAFETY",
      payload: {
        email: "participant@example.com",
        reflection: "I want to disappear",
        distress: 10,
      },
    })
    const serialized = JSON.stringify(rows)
    assert.equal(rows.length, 1)
    assert.equal(rows[0].action, "ADMIN_SAFETY_VIEWED")
    assert.doesNotMatch(
      serialized,
      /participant@example.com|I want to disappear|"distress":10/
    )
    assert.equal(rows[0].metadata, undefined)
  })
})

describe("HIPAA-3 exports", () => {
  it("writes one SUCCESS event per export without CSV body, email, or row payload", async () => {
    const actions = [
      "ADMIN_CHECKIN_EXPORTED",
      "ADMIN_HIGH_STRESS_EXPORTED",
      "ADMIN_STAMPLEY_SESSION_EXPORTED",
    ] as const

    for (const action of actions) {
      const { db, rows } = createAuditStore()
      await persistExportAuditOrThrow({
        db,
        actor: admin,
        action,
        requestId: createAuditRequestId(),
        metadata: {
          filterKeys: filterKeysFromAnalytics({
            q: "participant@example.com",
            from: "2026-01-01",
          }),
          rowCount: 2,
          identified: true,
        },
      })
      assert.equal(rows.length, 1)
      assert.equal(rows[0].action, action)
      assert.equal(rows[0].outcome, "SUCCESS")
      assert.equal(rows[0].resourceType, "EXPORT")
      const serialized = JSON.stringify(rows[0])
      assert.doesNotMatch(
        serialized,
        /participant@example.com|user_email|I feel anxious|csv/i
      )
      assert.deepEqual(rows[0].metadata, {
        filterKeys: ["from", "q"],
        rowCount: 2,
        identified: true,
      })
    }
  })

  it("audit failure prevents the CSV attachment response", async () => {
    const csv =
      "user_email,reflection\nparticipant@example.com,I feel anxious"
    const response = await respondWithAuditedCsv({
      persistAudit: async () => {
        throw new Error("persist failed")
      },
      csv,
      filename: "stampley-check-ins.csv",
    })
    assert.equal(response.status, 500)
    assert.equal(response.headers.get("Content-Disposition"), null)
    const body = await response.text()
    assert.doesNotMatch(body, /participant@example.com|I feel anxious/)
    assert.match(body, /Something went wrong/)
  })
})

describe("HIPAA-3 mutations", () => {
  it("role change and audit are atomic and authVersion still increments", async () => {
    const store = mutationStore()
    store.users.set("user-1", {
      id: "user-1",
      email: "participant@example.com",
      password: "hash",
      role: "PARTICIPANT",
      authVersion: 4,
    })
    const result = await auditedToggleUserRole(store.db, admin, {
      id: "user-1",
      currentRole: "PARTICIPANT",
    })
    assert.deepEqual(result, { newRole: "ADMIN" })
    assert.equal(store.users.get("user-1")?.authVersion, 5)
    assert.equal(store.rows.length, 1)
    assert.equal(store.rows[0].action, "ADMIN_ROLE_CHANGED")
    assert.deepEqual(store.rows[0].metadata, {
      fromRole: "PARTICIPANT",
      toRole: "ADMIN",
    })

    const failing = mutationStore({ failAudit: true })
    failing.users.set("user-1", {
      id: "user-1",
      email: "participant@example.com",
      password: "hash",
      role: "PARTICIPANT",
      authVersion: 4,
    })
    await assert.rejects(() =>
      simulateTransaction(failing, () =>
        auditedToggleUserRole(failing.db, admin, {
          id: "user-1",
          currentRole: "PARTICIPANT",
        })
      )
    )
    assert.equal(failing.users.get("user-1")?.role, "PARTICIPANT")
    assert.equal(failing.users.get("user-1")?.authVersion, 4)
    assert.equal(failing.rows.length, 0)
  })

  it("user creation and audit are atomic", async () => {
    const store = mutationStore()
    const created = await auditedCreateUser(store.db, admin, {
      email: "new@example.com",
      passwordHash: "hash",
      role: "PARTICIPANT",
    })
    assert.equal(store.users.has(created.id), true)
    assert.equal(store.rows.length, 1)
    assert.equal(store.rows[0].action, "ADMIN_USER_CREATED")
    assert.equal(store.rows[0].subjectUserId, created.id)
    assert.doesNotMatch(JSON.stringify(store.rows[0]), /new@example.com/)

    const failing = mutationStore({ failAudit: true })
    await assert.rejects(() =>
      simulateTransaction(failing, () =>
        auditedCreateUser(failing.db, admin, {
          email: "new@example.com",
          passwordHash: "hash",
          role: "PARTICIPANT",
        })
      )
    )
    assert.equal(failing.users.size, 0)
    assert.equal(failing.rows.length, 0)
  })

  it("user deletion and audit are atomic, and history survives actor or subject deletion", async () => {
    const store = mutationStore()
    store.users.set("subject-1", {
      id: "subject-1",
      email: "participant@example.com",
      password: "hash",
      role: "PARTICIPANT",
      authVersion: 1,
    })
    store.users.set("admin-1", {
      id: "admin-1",
      email: "admin@example.com",
      password: "hash",
      role: "ADMIN",
      authVersion: 1,
    })

    await appendAuditEvent(store.db, admin, {
      action: "ADMIN_PARTICIPANT_PROFILE_VIEWED",
      resourceType: "USER",
      resourceId: "subject-1",
      subjectUserId: "subject-1",
      outcome: "SUCCESS",
    })

    const deleted = await auditedDeleteUser(store.db, admin, "subject-1")
    assert.deepEqual(deleted, { deleted: true })
    assert.equal(store.users.has("subject-1"), false)
    assert.equal(
      store.rows.filter((row) => row.subjectUserId === "subject-1").length,
      2
    )

    store.users.delete("admin-1")
    assert.equal(
      store.rows.filter((row) => row.actorUserId === "admin-1").length,
      2
    )

    const failing = mutationStore({ failAudit: true })
    failing.users.set("subject-1", {
      id: "subject-1",
      email: "participant@example.com",
      password: "hash",
      role: "PARTICIPANT",
      authVersion: 1,
    })
    await assert.rejects(() =>
      simulateTransaction(failing, () =>
        auditedDeleteUser(failing.db, admin, "subject-1")
      )
    )
    assert.equal(failing.users.has("subject-1"), true)
    assert.equal(failing.rows.length, 0)

    const schema = readFileSync(
      join(HERE, "../prisma/schema.prisma"),
      "utf8"
    )
    const auditModel = schema.slice(schema.indexOf("model AuditLog"))
    assert.doesNotMatch(auditModel, /User\s+@relation/)
    assert.doesNotMatch(auditModel, /onDelete:\s*Cascade/)
    assert.doesNotMatch(auditModel, /references:\s*\[id\]/)
  })

  it("StudyKey audit stores the row id, not the plaintext key", async () => {
    const store = mutationStore()
    const created = await auditedCreateStudyKey(store.db, admin, {
      key: "AIDES-SECRET",
      createdBy: "admin@example.com",
    })
    assert.equal(created.id, "studykey-1")
    assert.equal(store.rows[0].resourceId, "studykey-1")
    assert.notEqual(store.rows[0].resourceId, "AIDES-SECRET")
    assert.doesNotMatch(JSON.stringify(store.rows[0]), /AIDES-SECRET|admin@example.com/)
  })
})

describe("HIPAA-3 auth events", () => {
  it("password-reset completion audit contains no token, email, or password and is fail-open", async () => {
    const { db, rows } = createAuditStore()
    const wrote = await recordPasswordResetCompletedFailOpen(db, "user-1")
    assert.equal(wrote, true)
    const serialized = JSON.stringify(rows[0])
    assert.equal(rows[0].action, "AUTH_PASSWORD_RESET_COMPLETED")
    assert.equal(rows[0].subjectUserId, "user-1")
    assert.doesNotMatch(
      serialized,
      /reset-token|participant@|passwordHash|"password"|hashedPassword/i
    )

    const failing = createAuditStore({ fail: true })
    const failed = await recordPasswordResetCompletedFailOpen(
      failing.db,
      "user-1"
    )
    assert.equal(failed, false)
    assert.equal(failing.rows.length, 0)
  })

  it("admin login success audit is fail-open", async () => {
    const { db, rows } = createAuditStore()
    const wrote = await recordAdminLoginSucceededFailOpen(db, admin)
    assert.equal(wrote, true)
    assert.equal(rows[0].action, "AUTH_ADMIN_LOGIN_SUCCEEDED")
    assert.doesNotMatch(JSON.stringify(rows[0]), /admin@|password/)

    const failing = createAuditStore({ fail: true })
    const failed = await recordAdminLoginSucceededFailOpen(failing.db, admin)
    assert.equal(failed, false)
  })
})

describe("HIPAA-3 fixtures and schema safety", () => {
  it("serialized audit fixtures contain no participant PHI content", async () => {
    const { db, rows } = createAuditStore()
    await appendAuditEvent(db, admin, {
      action: "ADMIN_CHECKIN_EXPORTED",
      resourceType: "EXPORT",
      outcome: "SUCCESS",
      requestId: createAuditRequestId(),
      metadata: {
        filterKeys: ["from", "q"],
        rowCount: 3,
        identified: true,
      },
    })
    const fixture = JSON.stringify(rows)
    assert.doesNotMatch(
      fixture,
      /@example\.com|PHQ|transcript|reflection|coping|I feel|distress|summary|AIDES-/i
    )
  })

  it("additive migration does not drop, alter PHI tables, or cascade to User", () => {
    const sql = readFileSync(
      join(HERE, "../prisma/migrations/20260920205000_add_audit_log/migration.sql"),
      "utf8"
    )
    assert.match(sql, /CREATE TYPE "audit_action"/)
    assert.match(sql, /CREATE TABLE "audit_logs"/)
    assert.match(sql, /CREATE INDEX "idx_audit_logs_occurred_at"/)
    assert.doesNotMatch(sql, /\bDROP\b/)
    assert.doesNotMatch(sql, /ALTER TABLE "users"/)
    assert.doesNotMatch(sql, /ALTER TABLE "check_in_submissions"/)
    assert.doesNotMatch(sql, /REFERENCES "users"/)
    assert.doesNotMatch(sql, /ON DELETE CASCADE/)
    assert.doesNotMatch(sql, /UPDATE /)
    assert.doesNotMatch(sql, /INSERT INTO "audit_logs"/)
  })
})
