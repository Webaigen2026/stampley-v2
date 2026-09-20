import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import {
  canAccessAdminPath,
  canGrantRole,
  creatableRolesFor,
  hasCapability,
  parseRequestedRole,
  visibleAdminNavHrefs,
} from "./admin-capabilities"
import {
  ADMIN_INVARIANT_LOCK_KEY,
  LastAdminInvariantError,
  wouldLeaveZeroAdmins,
  withAdminInvariantLock,
  assertCanRemovePrivilegedAdmin,
} from "./admin-last-admin"
import { requiresAdminStepUp } from "./admin-capabilities"
import { actorFromSession } from "./audit-admin"
import {
  auditedChangeUserRole,
  auditedDeleteUser,
} from "./admin-audited-mutations"
import type { AuditActor } from "./audit"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, "..")

function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8")
}

const admin: AuditActor = { userId: "admin-1", role: "ADMIN" }

function mutationStore() {
  const users = new Map<
    string,
    { id: string; email: string; password: string; role: string; authVersion: number }
  >()
  const rows: Array<{ action: string; outcome: string; metadata?: unknown }> = []
  let lockHeld = false
  let lockQueue = Promise.resolve()

  const db = {
    async $executeRaw() {
      const previous = lockQueue
      let release!: () => void
      lockQueue = new Promise<void>((resolve) => {
        release = resolve
      })
      await previous
      lockHeld = true
      queueMicrotask(() => {
        lockHeld = false
        release()
      })
      return 1
    },
    auditLog: {
      async create({ data }: { data: { action: string; outcome: string; metadata?: unknown } }) {
        rows.push(data)
        return data
      },
    },
    user: {
      async create() {
        return { id: "created-1" }
      },
      async findUnique(args: { where: { id: string }; select: { role: true } }) {
        const user = users.get(args.where.id)
        return user ? { role: user.role } : null
      },
      async count(args: { where: { role: "ADMIN"; id: { not: string } } }) {
        return [...users.values()].filter(
          (user) => user.role === "ADMIN" && user.id !== args.where.id.not
        ).length
      },
      async deleteMany(args: { where: { id: string } }) {
        if (!users.has(args.where.id)) return { count: 0 }
        users.delete(args.where.id)
        return { count: 1 }
      },
      async updateMany(args: {
        where: { id: string }
        data: { role: string; authVersion: { increment: 1 } }
      }) {
        const user = users.get(args.where.id)
        if (!user) return { count: 0 }
        user.role = args.data.role
        user.authVersion += args.data.authVersion.increment
        return { count: 1 }
      },
    },
    studyKey: {
      async create() {
        return { id: "key-1" }
      },
      async deleteMany() {
        return { count: 0 }
      },
    },
  }

  return { db, users, rows, isLockHeld: () => lockHeld }
}

describe("HIPAA-4 capabilities", () => {
  it("participant cannot access admin resources", () => {
    assert.equal(canAccessAdminPath("PARTICIPANT", "/admin/users"), false)
    assert.equal(canAccessAdminPath("PARTICIPANT", "/admin/safety"), false)
    assert.equal(hasCapability("PARTICIPANT", "canViewSafetyData"), false)
    assert.equal(visibleAdminNavHrefs("PARTICIPANT").length, 0)
  })

  it("study coordinator cannot access safety, transcripts, or PHQ-9 item 9", () => {
    assert.equal(canAccessAdminPath("STUDY_COORDINATOR", "/admin/safety"), false)
    assert.equal(canAccessAdminPath("STUDY_COORDINATOR", "/admin/stampley-chats"), false)
    assert.equal(hasCapability("STUDY_COORDINATOR", "canViewPhqItem9"), false)
    assert.equal(hasCapability("STUDY_COORDINATOR", "canViewCheckInNarratives"), false)
    assert.equal(hasCapability("STUDY_COORDINATOR", "canViewTranscripts"), false)
    assert.equal(hasCapability("STUDY_COORDINATOR", "canExportCodedResearchData"), true)
  })

  it("clinical reviewer can access clinical surfaces but not keys, roles, deletes, or exports", () => {
    assert.equal(canAccessAdminPath("CLINICAL_REVIEWER", "/admin/safety"), true)
    assert.equal(canAccessAdminPath("CLINICAL_REVIEWER", "/admin/stampley-chats"), true)
    assert.equal(hasCapability("CLINICAL_REVIEWER", "canViewPhqItem9"), true)
    assert.equal(canAccessAdminPath("CLINICAL_REVIEWER", "/admin/keys"), false)
    assert.equal(hasCapability("CLINICAL_REVIEWER", "canManageStudyKeys"), false)
    assert.equal(hasCapability("CLINICAL_REVIEWER", "canManagePrivilegedUsers"), false)
    assert.equal(hasCapability("CLINICAL_REVIEWER", "canDeleteUsers"), false)
    assert.equal(hasCapability("CLINICAL_REVIEWER", "canExportCodedResearchData"), false)
    assert.equal(hasCapability("CLINICAL_REVIEWER", "canViewContactInformation"), false)
  })

  it("hidden navigation is not the security boundary", () => {
    const hrefs = visibleAdminNavHrefs("STUDY_COORDINATOR")
    assert.equal(hrefs.includes("/admin/safety"), false)
    assert.equal(canAccessAdminPath("STUDY_COORDINATOR", "/admin/safety"), false)
    assert.match(read("app/admin/safety/page.tsx"), /requireAdminPage\("canViewSafetyData"\)/)
    assert.match(read("app/admin/stampley-chats/page.tsx"), /requireAdminPage\("canViewTranscripts"\)/)
    assert.match(read("app/admin/keys/page.tsx"), /requireAdminPage\("canManageStudyKeys"\)/)
  })

  it("coordinator can create participant only; forged roles are rejected", () => {
    assert.deepEqual(creatableRolesFor("STUDY_COORDINATOR"), ["PARTICIPANT"])
    assert.equal(canGrantRole("STUDY_COORDINATOR", "PARTICIPANT"), true)
    assert.equal(canGrantRole("STUDY_COORDINATOR", "ADMIN"), false)
    assert.equal(canGrantRole("CLINICAL_REVIEWER", "PARTICIPANT"), false)
    assert.equal(parseRequestedRole("SUPERUSER"), null)
    assert.equal(parseRequestedRole("admin"), "ADMIN")
    assert.equal(canGrantRole("ADMIN", "STUDY_COORDINATOR"), true)
  })
})

describe("HIPAA-4 role mutation safety", () => {
  it("server ignores client currentRole and only ADMIN may change roles", async () => {
    const store = mutationStore()
    store.users.set("user-1", {
      id: "user-1",
      email: "participant@example.com",
      password: "hash",
      role: "PARTICIPANT",
      authVersion: 2,
    })
    store.users.set("admin-1", {
      id: "admin-1",
      email: "admin@example.com",
      password: "hash",
      role: "ADMIN",
      authVersion: 1,
    })
    const result = await auditedChangeUserRole(store.db, admin, {
      id: "user-1",
      toRole: "CLINICAL_REVIEWER",
    })
    assert.equal(result.fromRole, "PARTICIPANT")
    assert.equal(result.newRole, "CLINICAL_REVIEWER")
    assert.equal(store.users.get("user-1")?.authVersion, 3)
    assert.equal(hasCapability("CLINICAL_REVIEWER", "canManagePrivilegedUsers"), false)
  })

  it("rejects self-demotion and self-delete without SUCCESS audit", async () => {
    const store = mutationStore()
    store.users.set("admin-1", {
      id: "admin-1",
      email: "admin@example.com",
      password: "hash",
      role: "ADMIN",
      authVersion: 1,
    })
    store.users.set("admin-2", {
      id: "admin-2",
      email: "admin2@example.com",
      password: "hash",
      role: "ADMIN",
      authVersion: 1,
    })
    await assert.rejects(
      () =>
        auditedChangeUserRole(store.db, admin, {
          id: "admin-1",
          toRole: "PARTICIPANT",
        }),
      /Unable to complete this action/
    )
    await assert.rejects(
      () => auditedDeleteUser(store.db, admin, "admin-1"),
      /Unable to complete this action/
    )
    assert.equal(store.users.get("admin-1")?.role, "ADMIN")
    assert.equal(store.rows.length, 0)
  })

  it("rejects last ADMIN demotion and deletion", async () => {
    const store = mutationStore()
    store.users.set("admin-1", {
      id: "admin-1",
      email: "admin@example.com",
      password: "hash",
      role: "ADMIN",
      authVersion: 1,
    })
    store.users.set("user-1", {
      id: "user-1",
      email: "other@example.com",
      password: "hash",
      role: "STUDY_COORDINATOR",
      authVersion: 1,
    })
    const otherAdmin: AuditActor = { userId: "user-1", role: "ADMIN" }
    await assert.rejects(
      () =>
        auditedChangeUserRole(store.db, otherAdmin, {
          id: "admin-1",
          toRole: "PARTICIPANT",
        }),
      LastAdminInvariantError
    )
    await assert.rejects(
      () => auditedDeleteUser(store.db, otherAdmin, "admin-1"),
      LastAdminInvariantError
    )
    assert.equal(store.users.get("admin-1")?.role, "ADMIN")
    assert.equal(store.users.has("admin-1"), true)
    assert.equal(store.rows.length, 0)
  })

  it("concurrent privileged removals cannot leave zero ADMIN", async () => {
    assert.equal(wouldLeaveZeroAdmins(0, true), true)
    assert.equal(wouldLeaveZeroAdmins(1, true), false)
    assert.match(
      read("lib/admin-last-admin.ts"),
      /pg_advisory_xact_lock/
    )
    assert.match(
      String(ADMIN_INVARIANT_LOCK_KEY),
      /748392001/
    )

    const users = new Map([
      ["a", { id: "a", role: "ADMIN" }],
      ["b", { id: "b", role: "ADMIN" }],
    ])
    let chain = Promise.resolve()

    async function serializedRemove(id: string) {
      const previous = chain
      let release!: () => void
      chain = new Promise<void>((resolve) => {
        release = resolve
      })
      await previous
      try {
        const remaining = [...users.values()].filter(
          (user) => user.role === "ADMIN" && user.id !== id
        ).length
        if (wouldLeaveZeroAdmins(remaining, true)) {
          return false
        }
        users.delete(id)
        return true
      } finally {
        release()
      }
    }

    const [first, second] = await Promise.all([
      serializedRemove("a"),
      serializedRemove("b"),
    ])
    const remainingAdmins = [...users.values()].filter((user) => user.role === "ADMIN")
    assert.equal(first !== second, true)
    assert.equal(remainingAdmins.length, 1)
  })

  it("advisory lock is acquired before recounting ADMIN users", async () => {
    const store = mutationStore()
    store.users.set("admin-1", {
      id: "admin-1",
      email: "admin@example.com",
      password: "hash",
      role: "ADMIN",
      authVersion: 1,
    })
    store.users.set("admin-2", {
      id: "admin-2",
      email: "admin2@example.com",
      password: "hash",
      role: "ADMIN",
      authVersion: 1,
    })
    await withAdminInvariantLock(store.db, async () => {
      await assertCanRemovePrivilegedAdmin(store.db, "admin-2")
    })
    await auditedDeleteUser(store.db, admin, "admin-2")
    assert.equal(store.users.has("admin-2"), false)
    assert.equal(store.users.get("admin-1")?.role, "ADMIN")
  })
})

describe("HIPAA-4 step-up", () => {
  it("requires re-auth only for create/promote ADMIN and delete user", () => {
    assert.equal(requiresAdminStepUp("ADMIN"), true)
    assert.equal(requiresAdminStepUp("STUDY_COORDINATOR"), false)
    assert.equal(requiresAdminStepUp("PARTICIPANT"), false)
    const actions = read("actions/admin.ts")
    assert.match(actions, /verifyActorStepUpPassword/)
    assert.match(actions, /createUser/)
    assert.match(actions, /changeUserRole/)
    assert.match(actions, /deleteUser/)
    assert.doesNotMatch(actions, /console\.(log|error|info|debug)\([^)]*password/i)
    const stepUp = read("lib/admin-step-up.ts")
    assert.doesNotMatch(stepUp, /console\.(log|error|info|debug)/)
    assert.match(stepUp, /verifyPassword/)
  })
})

describe("HIPAA-4 actor snapshots", () => {
  it("accepts new staff roles without adding AuditLog user FKs", () => {
    assert.deepEqual(
      actorFromSession({
        user: { id: "coord-1", role: "STUDY_COORDINATOR" },
      }),
      { userId: "coord-1", role: "STUDY_COORDINATOR" }
    )
    assert.deepEqual(
      actorFromSession({
        user: { id: "reviewer-1", role: "CLINICAL_REVIEWER" },
      }),
      { userId: "reviewer-1", role: "CLINICAL_REVIEWER" }
    )
    const schema = read("prisma/schema.prisma")
    const auditModel = schema.slice(schema.indexOf("model AuditLog"))
    assert.doesNotMatch(auditModel, /User\s+@relation/)
    assert.match(schema, /STUDY_COORDINATOR/)
    assert.match(schema, /CLINICAL_REVIEWER/)
    assert.doesNotMatch(schema, /SECURITY_ADMIN/)
  })
})

describe("HIPAA-4 page instrumentation", () => {
  it("PHI pages still write exactly one fail-closed page event", () => {
    for (const file of [
      "app/admin/users/[id]/page.tsx",
      "app/admin/pre-surveys/page.tsx",
      "app/admin/dds/page.tsx",
      "app/admin/post-surveys/page.tsx",
      "app/admin/check-ins/page.tsx",
      "app/admin/safety/page.tsx",
      "app/admin/stampley-chats/page.tsx",
      "app/admin/analytics/page.tsx",
    ]) {
      const source = read(file)
      assert.equal(
        source.match(/await recordPhiPageViewOrThrow/g)?.length ?? 0,
        1,
        file
      )
      assert.match(source, /requireAdminPage/)
    }
  })
})
