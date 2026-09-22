import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { extractSafeErrorMetadata } from "./stampley-generate-diagnostics"
import { serializeStampleyGenerateLog } from "./stampley-openai-context"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf8")
}

describe("extractSafeErrorMetadata", () => {
  it("defaults to Error name and omits sensitive message", () => {
    const err = new Error("participant-sensitive-message")
    const meta = extractSafeErrorMetadata(err)
    assert.equal(meta.errorName, "Error")
    const blob = JSON.stringify(meta)
    assert.doesNotMatch(blob, /participant-sensitive-message/)
    assert.equal("message" in meta, false)
    assert.equal("stack" in meta, false)
  })

  it("accepts identifier-like TypeError and Prisma error names", () => {
    const typeErr = new Error("x")
    typeErr.name = "TypeError"
    assert.equal(extractSafeErrorMetadata(typeErr).errorName, "TypeError")

    const prismaErr = new Error(
      "SELECT * FROM users WHERE email = 'secret@example.com'"
    )
    prismaErr.name = "PrismaClientKnownRequestError"
    const meta = extractSafeErrorMetadata(prismaErr)
    assert.equal(meta.errorName, "PrismaClientKnownRequestError")
    const blob = JSON.stringify(meta)
    assert.doesNotMatch(blob, /secret@example.com/)
    assert.doesNotMatch(blob, /SELECT/)
  })

  it("rejects newline, email-like, spaced, and punctuated Error.name", () => {
    const cases: Array<{ name: string; label: string }> = [
      { name: "Error\nparticipant@example.com", label: "newline" },
      { name: "participant@example.com", label: "email" },
      { name: "Error participant", label: "space" },
      { name: 'Error"quoted"', label: "quotes" },
      { name: "Error{leak}", label: "braces" },
      { name: "participant-sensitive-name", label: "hyphen" },
      { name: "", label: "empty" },
      { name: "A".repeat(65), label: "too-long" },
    ]
    for (const { name, label } of cases) {
      const err = new Error("x")
      err.name = name
      assert.equal(
        extractSafeErrorMetadata(err).errorName,
        "UnknownError",
        label
      )
      assert.doesNotMatch(JSON.stringify(extractSafeErrorMetadata(err)), /participant/)
    }
  })

  it("surfaces allowlisted Prisma codes safely", () => {
    const err = Object.assign(new Error("hidden detail"), {
      name: "PrismaClientKnownRequestError",
      code: "P2002",
    })
    const meta = extractSafeErrorMetadata(err)
    assert.equal(meta.safeErrorCode, "P2002")
    assert.doesNotMatch(JSON.stringify(meta), /hidden detail/)
  })

  it("surfaces allowlisted Postgres numeric codes safely", () => {
    const err = Object.assign(new Error("relation detail"), {
      name: "Error",
      code: "23505",
    })
    assert.equal(extractSafeErrorMetadata(err).safeErrorCode, "23505")
  })

  it("surfaces allowlisted Node network codes safely", () => {
    const err = Object.assign(new Error("connect ECONNREFUSED 127.0.0.1"), {
      name: "Error",
      code: "ECONNREFUSED",
    })
    assert.equal(extractSafeErrorMetadata(err).safeErrorCode, "ECONNREFUSED")
  })

  it("does not log arbitrary/unsafe code values verbatim", () => {
    const err = Object.assign(new Error("x"), {
      name: "Error",
      code: "user-123-email-leak",
    })
    const meta = extractSafeErrorMetadata(err)
    assert.equal(meta.safeErrorCode, undefined)
    assert.doesNotMatch(JSON.stringify(meta), /user-123-email-leak/)
  })

  it("uses UnknownError for non-Error values", () => {
    assert.deepEqual(extractSafeErrorMetadata("boom"), {
      errorName: "UnknownError",
    })
    assert.deepEqual(extractSafeErrorMetadata(null), {
      errorName: "UnknownError",
    })
  })
})

describe("generate diagnostic logging privacy", () => {
  it("serialized failure events omit message/stack and keep only safe fields", () => {
    const serialized = serializeStampleyGenerateLog({
      event: "db_failure",
      stage: "participant_persist",
      errorName: "Error",
      safeErrorCode: "P2021",
    })
    const blob = JSON.stringify(serialized)
    assert.match(blob, /participant_persist/)
    assert.match(blob, /P2021/)
    assert.doesNotMatch(blob, /"message"/)
    assert.doesNotMatch(blob, /"stack"/)
    assert.doesNotMatch(blob, /userId/)
    assert.doesNotMatch(blob, /sessionId/)
  })

  it("generate route returns generic participant-facing failure text", () => {
    const route = read("app/api/stampley/generate/route.ts")
    assert.match(
      route,
      /error: "Failed to generate response"/
    )
    assert.match(route, /extractSafeErrorMetadata/)
    assert.match(route, /stage: "participant_persist"/)
    assert.match(route, /stage: "assistant_lookup"/)
    assert.match(route, /stage: "context_build"/)
    assert.match(route, /stage: "mode_select"/)
    assert.match(route, /stage: "prompt_build"/)
    assert.doesNotMatch(route, /error\.message/)
    assert.doesNotMatch(route, /error\.stack/)
    // Single-level log payloads must not include PHI field names (avoid
    // cross-file [\s\S]* false positives against nearby non-log uses).
    assert.doesNotMatch(
      route,
      /stampleyGenerateLog\(\s*console,\s*\{[^{}]*participantText/
    )
    assert.doesNotMatch(
      route,
      /stampleyGenerateLog\(\s*console,\s*\{[^{}]*messageHistory/
    )
  })
})
