import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { defaultExpandedCardForAssistantMessage } from "./stampley-micro-skill-ui"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

describe("defaultExpandedCardForAssistantMessage", () => {
  it("opens Micro-skill when micro_skill text is present", () => {
    assert.equal(
      defaultExpandedCardForAssistantMessage("msg-1", {
        micro_skill: "Relax your shoulders once.",
      }),
      "msg-1-skill"
    )
  })

  it("returns null when micro_skill is missing or blank", () => {
    assert.equal(
      defaultExpandedCardForAssistantMessage("msg-1", { micro_skill: "" }),
      null
    )
    assert.equal(
      defaultExpandedCardForAssistantMessage("msg-1", { micro_skill: "   " }),
      null
    )
    assert.equal(defaultExpandedCardForAssistantMessage("msg-1", {}), null)
    assert.equal(defaultExpandedCardForAssistantMessage("msg-1", null), null)
  })

  it("does not open when only non-skill fields exist", () => {
    assert.equal(
      defaultExpandedCardForAssistantMessage("msg-2", {
        micro_skill: "",
      }),
      null
    )
  })
})

describe("stampley-support micro-skill default-open wiring", () => {
  it("uses the helper when appending assistant messages and keeps Skill toggle", () => {
    const page = readFileSync(
      join(ROOT, "app/check-in/stampley-support/page.tsx"),
      "utf8"
    )
    assert.match(page, /defaultExpandedCardForAssistantMessage/)
    assert.match(
      page,
      /setExpandedCard\(\s*defaultExpandedCardForAssistantMessage\(/
    )
    assert.match(page, /expandedCard === `\$\{msg\.id\}-skill`/)
    assert.match(page, /label="Skill"/)
    assert.match(page, /title="Micro-skill"/)
    assert.match(page, /aria-expanded=\{active\}/)
  })
})
