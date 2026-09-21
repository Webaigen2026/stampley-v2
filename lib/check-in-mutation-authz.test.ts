import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { isParticipantRole, isStaffRole } from "./admin-capabilities"
import {
  CHECK_IN_MUTATION_FORBIDDEN,
  CHECK_IN_MUTATION_UNAUTHORIZED,
  resolveCheckInMutationAccess,
} from "./check-in-mutation-authz"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8")
}

function functionSource(source: string, name: string): string {
  const start = source.indexOf(`export async function ${name}`)
  assert.notEqual(start, -1, `missing ${name}`)
  const next = source.indexOf("export async function ", start + 1)
  return next === -1 ? source.slice(start) : source.slice(start, next)
}

describe("Daily Check-In mutation authorization", () => {
  it("rejects unauthenticated and missing-id sessions with 401", () => {
    assert.deepEqual(resolveCheckInMutationAccess(null), {
      ok: false,
      status: 401,
      error: CHECK_IN_MUTATION_UNAUTHORIZED,
    })
    assert.deepEqual(resolveCheckInMutationAccess({ user: { role: "PARTICIPANT" } }), {
      ok: false,
      status: 401,
      error: CHECK_IN_MUTATION_UNAUTHORIZED,
    })
    assert.deepEqual(
      resolveCheckInMutationAccess({ user: { id: "", role: "PARTICIPANT" } }),
      {
        ok: false,
        status: 401,
        error: CHECK_IN_MUTATION_UNAUTHORIZED,
      }
    )
  })

  it("allows only PARTICIPANT sessions through the mutation gate", () => {
    assert.equal(isParticipantRole("PARTICIPANT"), true)
    assert.deepEqual(
      resolveCheckInMutationAccess({
        user: { id: "participant-1", role: "PARTICIPANT" },
      }),
      { ok: true, userId: "participant-1" }
    )
  })

  it("rejects ADMIN, STUDY_COORDINATOR, CLINICAL_REVIEWER, and unknown staff-like roles", () => {
    for (const role of [
      "ADMIN",
      "STUDY_COORDINATOR",
      "CLINICAL_REVIEWER",
      "STAFF",
    ]) {
      assert.equal(isParticipantRole(role), false)
      assert.deepEqual(
        resolveCheckInMutationAccess({
          user: { id: "staff-1", role },
        }),
        {
          ok: false,
          status: 403,
          error: CHECK_IN_MUTATION_FORBIDDEN,
        }
      )
    }
    assert.equal(isStaffRole("STAFF"), false)
  })

  it("does not trust a client-supplied userId and only returns session.user.id", () => {
    const access = resolveCheckInMutationAccess({
      user: { id: "session-user", role: "PARTICIPANT" },
    })
    assert.equal(access.ok, true)
    if (!access.ok) throw new Error("unreachable")
    assert.equal(access.userId, "session-user")
  })
})

describe("Daily Check-In mutation route wiring", () => {
  it("submit uses the participant gate and session-derived userId", () => {
    const source = read("app/api/check-in/submit/route.ts")
    assert.match(source, /resolveCheckInMutationAccess\(session\)/)
    assert.doesNotMatch(source, /session\.user\.id/)
    assert.match(source, /const userId = access\.userId/)
    assert.doesNotMatch(source, /body\.userId/)
  })

  it("weekly-domain POST uses the same participant gate; GET stays session-id only", () => {
    const source = read("app/api/check-in/weekly-domain/route.ts")
    const post = functionSource(source, "POST")
    const get = functionSource(source, "GET")

    assert.match(post, /resolveCheckInMutationAccess\(session\)/)
    assert.match(post, /const userId = access\.userId/)
    assert.doesNotMatch(get, /resolveCheckInMutationAccess/)
    assert.match(get, /session\.user\.id/)
  })
})
