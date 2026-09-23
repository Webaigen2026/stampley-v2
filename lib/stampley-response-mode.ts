import type { ConversationPhase } from "@/lib/stampley-openai-context"

/**
 * Server-side conversation policy mode.
 * Not persisted; not exposed to the browser.
 * highStress remains an independent tone modifier (not a mode).
 */
export type StampleyResponseMode =
  | "MEDICAL_BOUNDARY"
  | "PRACTICAL_SUPPORT"
  | "EMPATHY"
  | "REFLECT"
  | "CLOSE"

export type SelectStampleyResponseModeInput = {
  /** Persisted authoritative participant text, or null/empty for greeting. */
  participantText: string | null | undefined
  /** Soft pacing phase from deriveConversationPhase (not sole authority). */
  phase: ConversationPhase
}

/** Normalize for conservative pattern matching. */
export function normalizeParticipantTextForMode(value: unknown): string {
  if (typeof value !== "string") return ""
  return value
    .toLowerCase()
    .replace(/['’]/g, "'")
    .replace(/[^\w\s'?]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const MED_NOUN =
  "(insulin|medication|medicine|metformin|dose|dosage|pills?)"

/**
 * High-confidence personalized medical/treatment-decision requests.
 * Ordinary "ask my doctor" / medication-memory questions do NOT match.
 */
export function isPersonalizedMedicalDecisionRequest(text: unknown): boolean {
  const n = normalizeParticipantTextForMode(text)
  if (!n) return false

  if (
    /\b(diagnos(e|is|ing)|can you diagnose|do i have diabetes complications)\b/.test(
      n
    )
  ) {
    return true
  }

  if (
    /\b(how much insulin|what dose|what dosage|how many units)\b/.test(n)
  ) {
    return true
  }

  // Dose / medication change asks (can/should/could + more/less/higher/lower/change).
  if (
    new RegExp(
      `\\b(can|should|could) i\\b.{0,40}\\b(take more|take less|take a (higher|lower) dose|increase|decrease|lower|raise|change|stop|skip|start)\\b.{0,40}\\b${MED_NOUN}\\b`
    ).test(n)
  ) {
    return true
  }

  if (
    /\b(can|should|could) i take (more|less)\b.{0,40}\b(insulin|medication|medicine|metformin|pills?)\b/.test(
      n
    )
  ) {
    return true
  }

  if (
    /\b(can|should|could) i (change|adjust) (my )?dose\b/.test(n) ||
    /\b(can|should|could) i take a (higher|lower) dose\b/.test(n)
  ) {
    return true
  }

  // "Would it help to take more insulin / change my dose"
  if (
    new RegExp(
      `\\bwould it help\\b.{0,48}\\b(take more|take less|increase|decrease|change|stop|adjust)\\b.{0,40}\\b${MED_NOUN}\\b`
    ).test(n)
  ) {
    return true
  }

  // "What should I do about my insulin dose / medication dose"
  if (
    /\bwhat should i do about (my )?(insulin|medication|medicine|metformin)( dose|dosage)?\b/.test(
      n
    ) ||
    /\bwhat should i do about (my )?(medication |medicine )?dose\b/.test(n) ||
    /\bwhat can i do about (my )?(medication |medicine )?dose\b/.test(n) ||
    /\bwhat should i do with (my )?insulin\b/.test(n)
  ) {
    return true
  }

  // Medication / dose choice asks (B-6 medical safety for guidance verbs).
  if (
    /\bwhat (medication|medicine|meds|pills?) should i try\b/.test(n) ||
    /\b(can|could) you suggest (a |an |some )?(different |another )?(medication|medicine|metformin|insulin|dose|dosage)\b/.test(
      n
    ) ||
    /\b(can|could) you suggest how much (metformin|insulin|medication|medicine)\b/.test(
      n
    ) ||
    /\bwhat (would|do) you recommend (for|about) (my )?(insulin|medication|medicine|metformin|dose|dosage)\b/.test(
      n
    ) ||
    /\bgive me (an |a |some )?idea for (changing|change|adjusting|adjust) (my )?dose\b/.test(
      n
    ) ||
    /\bwhat should i take next\b/.test(n) ||
    /\bshould i take another dose\b/.test(n) ||
    /\btell me (what|how much|which) dose\b/.test(n) ||
    /\btell me how much (insulin|metformin|medication|medicine)\b/.test(n)
  ) {
    return true
  }

  if (
    new RegExp(
      `\\b(increase|decrease|lower|raise|change|stop taking|skip)\\b.{0,40}\\b(my )?${MED_NOUN}\\b`
    ).test(n)
  ) {
    return true
  }

  if (/\b(different|another) medication\b/.test(n)) {
    return true
  }

  if (/\bdo i need (a |to )?different medication\b/.test(n)) {
    return true
  }

  return false
}

/**
 * Defensive exclusion: medication/treatment-action language must never
 * route to PRACTICAL_SUPPORT via readiness (even if the medical detector
 * misses a variant). Fail closed for readiness only — does not expand
 * MEDICAL_BOUNDARY selection.
 */
export function hasMedicationTreatmentActionLanguage(text: unknown): boolean {
  const n = normalizeParticipantTextForMode(text)
  if (!n) return false

  const hasMedNoun =
    /\b(insulin|metformin|medication|medicine|meds|pills?|dose|dosage|prescription)\b/.test(
      n
    )
  if (!hasMedNoun) return false

  if (
    /\b(increase|increasing|decrease|decreasing|reduc(e|ing)|lower|raise|chang(e|ing)|adjust(ing)?|stop|skip|double|doubling)\b/.test(
      n
    )
  ) {
    return true
  }
  if (/\btake (more|less)\b/.test(n)) return true
  if (/\btaking (more|less)\b/.test(n)) return true
  if (/\banother (dose|pill)\b/.test(n)) return true
  if (/\b(higher|lower) dose\b/.test(n)) return true
  if (/\b(start|stop) (taking )?(my )?(insulin|metformin|medication|medicine|meds|pills?)\b/.test(n)) {
    return true
  }

  return false
}

/**
 * Participant-owned non-medical readiness / change-goal / self-proposed action.
 * Feeds PRACTICAL_SUPPORT. Does NOT merge into isPracticalSupportRequest.
 * Fail closed on negation, uncertainty, bare affirmatives, third-party intent,
 * failed/past plans, and medication/treatment-action language.
 */
export function isReadinessToActionSignal(text: unknown): boolean {
  const n = normalizeParticipantTextForMode(text)
  if (!n) return false

  // Safety: never treat treatment-action language as behavioral readiness.
  if (hasMedicationTreatmentActionLanguage(n)) return false

  // Bare affirmatives alone are never readiness.
  if (
    /^(yes|yeah|yep|yup|ok|okay|sure|got it|i understand|alright|all right)\.?$/.test(
      n
    )
  ) {
    return false
  }

  // Uncertainty — not readiness.
  if (
    /^(maybe|not sure|i (don't|do not) know|idk)\.?$/.test(n) ||
    /^i (don't|do not) know\b/.test(n)
  ) {
    return false
  }

  // Negation / refusal — fail closed before positive patterns.
  if (
    /\b(don't|do not|doesn't|does not) want to\b/.test(n) ||
    /\b(i'?m|i am) not ready\b/.test(n) ||
    /\bnot ready to\b/.test(n) ||
    /\b(can't|cannot|won't|will not) try\b/.test(n) ||
    /\b(don't|do not) think i can\b/.test(n) ||
    /\b(won't|will not) (try|do|change)\b/.test(n)
  ) {
    return false
  }

  // Past / failed plans — not current readiness.
  if (
    /\b(was going to|planned to|was planning to)\b.{0,48}\b(but|and)\b.{0,24}\b(didn't|did not|couldn't|could not|wasn't able|was not able)\b/.test(
      n
    ) ||
    /\bwasn't able to\b/.test(n) ||
    /\bwas not able to\b/.test(n) ||
    /\bi tried that (already|before)\b/.test(n) ||
    /\btried that (already|before)\b.{0,40}\b(didn't|did not) work\b/.test(n) ||
    /\btried .{0,40}\band it (didn't|did not) work\b/.test(n)
  ) {
    return false
  }

  // Third-party intention — not participant-owned readiness.
  if (
    /\b(my )?(doctor|clinician|care team|nurse|pharmacist) (wants|wanted|told|said|advised|asked) (me )?(to )?\b/.test(
      n
    )
  ) {
    return false
  }

  // Positive readiness / change-goal / self-proposed action (conservative).
  if (
    // Intention
    /\bi want to try\b/.test(n) ||
    /\bi('d| would) like to try\b/.test(n) ||
    /\bi plan to\b/.test(n) ||
    /\bi think i should try\b/.test(n) ||
    // Willingness
    /\bi can try\b/.test(n) ||
    /\bi could try\b/.test(n) ||
    /\bi('m| am) willing to\b/.test(n) ||
    /\bi('ll| will) try\b/.test(n) ||
    // Self-proposed behavioral action
    /\bi('ll| will) start\b/.test(n) ||
    /\bi('ll| will) stop\b/.test(n) ||
    /\bi('ll| will) reduce\b/.test(n) ||
    /\bi('ll| will) switch\b/.test(n) ||
    /\bi('ll| will) keep track\b/.test(n) ||
    /\bi('ll| will) set a reminder\b/.test(n) ||
    // Acceptance with explicit action language (not bare yes)
    /\byes[, ]+i can try (that|it|this)\b/.test(n) ||
    /\bthat sounds doable\b/.test(n) ||
    /\bi think that could work\b/.test(n) ||
    /\bthat could work\b/.test(n)
  ) {
    return true
  }

  return false
}

/**
 * High-confidence practical guidance / actionable-support requests.
 * Emotional "I don't know what to do anymore" does NOT match.
 * Ambiguous anaphoric help ("help me with that") stays non-practical —
 * this detector only receives the newest participant text (no history).
 *
 * B-6: also matches direct non-medical suggestion / what-to-do / tell-me /
 * idea / guidance requests. Isolated words alone do not match.
 */
export function isPracticalSupportRequest(text: unknown): boolean {
  const n = normalizeParticipantTextForMode(text)
  if (!n) return false

  // Medical / treatment-seeking must never become practical coaching.
  // (MEDICAL_BOUNDARY still wins in selectStampleyResponseMode when detected.)
  if (isPersonalizedMedicalDecisionRequest(n)) return false
  if (hasMedicationTreatmentActionLanguage(n)) return false
  if (isTreatmentSeekingPracticalCollision(n)) return false

  // Emotional overwhelm / uncertainty — not an actionable ask.
  // Keep "I don't know, you tell me" out of this block (handled below as
  // a narrow direct-guidance family).
  if (isEmotionalUncertaintyNotPracticalAsk(n)) {
    return false
  }

  // Statements that mention "what to do" without asking for guidance.
  if (
    /\b(my doctor|doctor) (told|said|advised)\b.{0,40}\bwhat to do\b/.test(n)
  ) {
    return false
  }
  if (/^i should do\b/.test(n) || /\bi should do better\b/.test(n)) {
    return false
  }
  if (/^i can do (this|that|it)\b/.test(n)) {
    return false
  }
  // Clarification / emotion questions — not practical-support asks.
  if (
    /^what do you mean\b/.test(n) ||
    /^really\??$/.test(n) ||
    /^why do i feel\b/.test(n)
  ) {
    return false
  }

  // Negated / refused help or idea-seeking.
  if (isNegatedGuidanceRequest(n)) {
    return false
  }

  // Third-party / past descriptive statements — not a request to Stampley.
  if (isThirdPartyGuidanceStatement(n)) {
    return false
  }

  // Ambiguous anaphoric help without a concrete task — leave REFLECT.
  // (Newest-text-only routing; no conversation history resolution.)
  // Distinct from the narrow "you tell me" guidance family below.
  if (
    /^(can|could) you help me with (that|this|it)\??$/.test(n) ||
    /^help me with (that|this|it)\??$/.test(n) ||
    /^help me$/.test(n) ||
    /^help\??$/.test(n)
  ) {
    return false
  }

  if (
    /\bwhat should i\b.{0,24}\b(do|try|ask)\b/.test(n) ||
    /\bwhat can i\b.{0,24}\b(do|try|ask)\b/.test(n) ||
    /\bwhat else can i do\b/.test(n) ||
    /\bwhat do you recommend\b/.test(n) ||
    /\bwhat would you recommend\b/.test(n) ||
    /\bwhat (are|is|s) your advice\b/.test(n) ||
    /\bwhat'?s your advice\b/.test(n) ||
    /\bcan you (give|offer) (me )?(some )?advice\b/.test(n) ||
    /\bhow (can|do) i handle (this|it)\b/.test(n) ||
    /\bhow (can|do) i deal with (this|it)\b/.test(n) ||
    /\bwhat should i ask (my )?doctor\b/.test(n) ||
    /\bwhat can i ask (my )?doctor\b/.test(n) ||
    /\bis there anything i can do\b/.test(n) ||
    /\bis there anything that might help\b/.test(n) ||
    /\bwhat would help\b/.test(n) ||
    /\bwhat can help( me)?\b/.test(n) ||
    /\bany suggestions\b/.test(n) ||
    /\bany advice\b/.test(n) ||
    /\bany tips\b/.test(n) ||
    /\bdo you have (any )?ideas\b/.test(n) ||
    // B-5: list / question / appointment preparation
    /\b(can|could) you help me (make|prepare|create|organize) (a |some )?(list|questions?|topics?)\b/.test(
      n
    ) ||
    /\bhelp me (make|prepare|create|organize) (a |some )?(list|questions?|topics?)\b/.test(
      n
    ) ||
    /\b(can|could) you help me prepare (some )?questions\b/.test(n) ||
    /\bhelp me prepare (some )?questions\b/.test(n) ||
    /\b(can|could) you help me (make|prepare) a list of questions\b/.test(n) ||
    /\bhelp me (make|prepare) a list of questions\b/.test(n) ||
    /\bhelp me organize (what|things) (i want to )?(discuss|say|ask)\b/.test(
      n
    ) ||
    /\b(can|could) you help me organize .{0,40}\b(appointment|doctor|visit)\b/.test(
      n
    ) ||
    // B-5: options
    /\bwhat are some options\b/.test(n) ||
    /\bwhat (are|is) (some of )?my options\b/.test(n) ||
    /\bwhat options do i have\b/.test(n) ||
    /\b(can|could) you (give|offer) (me )?(some |a few )?options\b/.test(n) ||
    /\bgive me (some |a few )?options\b/.test(n) ||
    // B-5: ideas (beyond existing "do you have any ideas")
    /\b(can|could) you (give|offer) (me )?(some |a few )?ideas\b/.test(n) ||
    /\bgive me (some |a few )?ideas\b/.test(n) ||
    /\b(can|could) you help me think of (some )?ideas\b/.test(n) ||
    /\bhelp me think of (some )?ideas\b/.test(n) ||
    // B-5: alternatives (non-treatment; treatment collisions blocked above)
    /\bwhat are some alternatives\b/.test(n) ||
    /\b(can|could) you suggest (some )?alternatives\b/.test(n) ||
    /\b(can|could) you help me (think of|find) (some )?alternatives\b/.test(
      n
    ) ||
    /\bhelp me (think of|find) (some )?alternatives\b/.test(n) ||
    // B-6: suggestion requests
    /\bwhat (will|would|do|can) you suggest\b/.test(n) ||
    /\b(can|could) you suggest (something|anything|one|a few)\b/.test(n) ||
    /\b(can|could) you suggest\b.{0,40}\b(i can|to )?(do|try)\b/.test(n) ||
    /^suggest (something|anything)\b/.test(n) ||
    /\bsuggest (something|anything) i can (do|try)\b/.test(n) ||
    // B-6: bare / short "what to do" asks (utterance-shaped; not embedded
    // emotional "I don't know what to do anymore")
    /^what to do(\s+next)?\??$/.test(n) ||
    // B-6: direct imperative guidance
    /\btell me what (to do|i can try|i should (do|try)|i could try)\b/.test(
      n
    ) ||
    // B-6: narrow "you tell me" / "I don't know, you tell me" — explicit
    // handoff to Stampley for guidance (not bare "I don't know").
    /^you tell me\??$/.test(n) ||
    /^i (don't|do not|dont) know[, ]+you tell me\??$/.test(n) ||
    // B-6: singular idea / next-step
    /\bgive me (an |a )?idea\b/.test(n) ||
    /\b(can|could) you (give|offer) (me )?(an |a )?idea\b/.test(n) ||
    /\bgive me (a |one )?(next )?step\b/.test(n) ||
    /\b(can|could) you give me (a |one )?(next )?step\b/.test(n) ||
    // B-6: guidance requests
    /\bi need (some )?guidance\b/.test(n) ||
    /\b(can|could) you (give|offer) (me )?(some )?guidance\b/.test(n) ||
    /\bgive me (some )?guidance\b/.test(n) ||
    /\bany guidance\b/.test(n)
  ) {
    return true
  }

  return false
}

/**
 * Emotional uncertainty / overwhelm that must not route PRACTICAL_SUPPORT
 * merely because it contains "what to do", "idea", or "next".
 */
function isEmotionalUncertaintyNotPracticalAsk(n: string): boolean {
  // Bare uncertainty (not "I don't know, you tell me").
  if (/^i (don't|do not|dont) know\.?$/.test(n)) return true
  if (/^i feel lost\.?$/.test(n)) return true

  if (
    /\bi (don't|do not|dont) know what to do( anymore| any more)?\b/.test(n) ||
    /\bi have no idea what to do( anymore| any more)?\b/.test(n) ||
    /\bi (don't|do not|dont) know how to handle (this|it)( anymore| any more)?\b/.test(
      n
    ) ||
    /\bi (don't|do not|dont) know if i can( do this)?\b/.test(n) ||
    /\bi (don't|do not|dont) know what comes next\b/.test(n) ||
    /\bi feel overwhelmed\b.{0,48}\b(don't|do not|dont) know what to do\b/.test(
      n
    )
  ) {
    // Still allow when an independent explicit practical ask is also present.
    if (
      /\bwhat (should|can|else) i (do|try)\b/.test(n) ||
      /\bany suggestions\b/.test(n) ||
      /\bany tips\b/.test(n) ||
      /\bany (options|ideas|alternatives)\b/.test(n) ||
      /\bwhat (will|would|do|can) you suggest\b/.test(n) ||
      /\btell me what (to do|i can try)\b/.test(n)
    ) {
      return false
    }
    return true
  }

  return false
}

function isNegatedGuidanceRequest(n: string): boolean {
  if (
    /\b(don't|do not|doesn't|does not|dont) (need|want) (any )?(help|ideas?|options?|suggestions?|tips?|alternatives?|guidance|recommendations?|advice)\b/.test(
      n
    ) ||
    /\bi already have (some )?(options?|ideas?|alternatives?)\b/.test(n) ||
    /\b(don't|do not|dont) suggest\b/.test(n) ||
    /\b(please )?(don't|do not|dont) tell me what to do\b/.test(n) ||
    /\b(i am|i'm|im) not asking for (any )?(advice|suggestions?|guidance|ideas?|recommendations?)\b/.test(
      n
    )
  ) {
    return true
  }
  return false
}

function isThirdPartyGuidanceStatement(n: string): boolean {
  if (
    /\b(my friend|my mother|my mom|someone else) (needs|needed) help\b/.test(
      n
    ) ||
    /\bi helped .{0,48}\b(make|prepare) (a )?list\b/.test(n) ||
    /\b(my )?(doctor|clinician) (gave|suggested|recommended|told)\b.{0,48}\b(list|alternatives?|options?|ideas?|what to do)\b/.test(
      n
    ) ||
    /\b(my )?(friend|wife|husband|brother|sister|partner|mom|mother|dad) (asked|wants|wanted|needs|needed)\b.{0,48}\b(what to do|suggestions?|guidance|ideas?|recommendations?|what (she|he|they) should do)\b/.test(
      n
    ) ||
    /\b(my )?(wife|husband|friend|brother|sister) asked me what (she|he|they) should do\b/.test(
      n
    )
  ) {
    return true
  }
  return false
}

/**
 * Defensive block: help/options/ideas/alternatives seeking about
 * medication/treatment topics must not route PRACTICAL_SUPPORT even when
 * the medical detector misses a variant. Clinician-prep (questions/list for
 * doctor/appointment) is allowed through for practical matching.
 */
function isTreatmentSeekingPracticalCollision(text: unknown): boolean {
  const n = normalizeParticipantTextForMode(text)
  if (!n) return false

  const hasMedTopic =
    /\b(insulin|metformin|medication|medicine|meds|pills?|dose|dosage|prescription|treatment)\b/.test(
      n
    )
  if (!hasMedTopic) return false

  const clinicianPrep =
    /\b(questions?|topics?|list)\b.{0,48}\b(doctor|clinician|care team|appointment|visit|ask)\b/.test(
      n
    ) ||
    /\b(prepare|make|organize|write)\b.{0,48}\b(questions?|list|topics?)\b.{0,48}\b(doctor|clinician|care team|appointment|visit)\b/.test(
      n
    ) ||
    /\bhelp me prepare (some )?questions\b/.test(n) ||
    /\bhelp me (make|prepare) a list of questions\b/.test(n)

  if (clinicianPrep) return false

  if (
    /\balternative (medication|medicine|meds|insulin|treatment|dose|dosage)\b/.test(
      n
    ) ||
    /\b(different|another) (medication|medicine|treatment)\b/.test(n) ||
    /\b(options?|ideas?|alternatives?|suggestions?|guidance|recommendations?) (for|about|on|to)\b.{0,40}\b(insulin|dose|dosage|medication|medicine|meds|treatment|pills?)\b/.test(
      n
    ) ||
    /\bhelp me (increase|decrease|lower|raise|change|adjust|decide|choose|skip|stop)\b.{0,40}\b(insulin|dose|dosage|medication|medicine|meds|treatment|pills?)\b/.test(
      n
    ) ||
    /\bhelp me .{0,40}\b(how much|units|dosage)\b.{0,40}\b(insulin|medication|medicine|dose)\b/.test(
      n
    ) ||
    /\b(give|suggest|offer|recommend|tell) (me )?(some |a few |an |a )?(options?|ideas?|alternatives?|suggestion|guidance)?\b.{0,48}\b(insulin|dose|dosage|medication|medicine|meds|treatment|metformin)\b/.test(
      n
    ) ||
    /\b(options?|ideas?|alternatives?).{0,40}\b(changing|change|adjust|increase|decrease|lower|raise)\b.{0,40}\b(insulin|dose|dosage|medication|medicine|meds|treatment)\b/.test(
      n
    ) ||
    /\bwhat (should|can|would) i (do|try|take|use)\b.{0,40}\b(insulin|dose|dosage|medication|medicine|meds|metformin|treatment)\b/.test(
      n
    )
  ) {
    return true
  }

  return false
}

/**
 * Explicit participant intent to end the Stampley chat turn.
 * Does not win over medical/practical requests (checked later in precedence).
 * Soft-close eligibility may still block CLOSE when an unresolved question remains.
 */
export function isExplicitClosingIntent(text: unknown): boolean {
  const n = normalizeParticipantTextForMode(text)
  if (!n) return false

  // If a clear practical/medical ask is also present, closing detector
  // may still match substrings — precedence handles override.
  if (
    /\b(that'?s all|thats all)\b/.test(n) ||
    /\bthat'?s all i wanted\b/.test(n) ||
    /\bthat is all i wanted\b/.test(n) ||
    /\bi'?m done\b/.test(n) ||
    /\bi am done\b/.test(n) ||
    /\bi think i'?m good now\b/.test(n) ||
    /\bi think i am good now\b/.test(n) ||
    /\bthat'?s it for today\b/.test(n) ||
    /\bthat is it for today\b/.test(n) ||
    /\bno[, ]+that'?s all\b/.test(n) ||
    /\bthanks[, ]+(that'?s|thats) all\b/.test(n)
  ) {
    return true
  }

  return false
}

/**
 * Closure-eligibility helper only — does NOT route to PRACTICAL_SUPPORT.
 * Blocks forced/soft CLOSE when the participant still appears to be asking something.
 */
export function hasUnresolvedQuestion(text: unknown): boolean {
  const n = normalizeParticipantTextForMode(text)
  if (!n) return false

  if (/\?/.test(n)) return true
  if (/\bi (don't|do not) understand\b/.test(n)) return true
  if (/\bcan you explain\b/.test(n)) return true
  if (
    /^(what|why|how|can|could|would|should|do|does|is|are|who|when|where)\b/.test(
      n
    )
  ) {
    return true
  }

  return false
}

/**
 * Late-conversation continuation / new concern — prefer REFLECT over CLOSE.
 */
export function hasContinuingOrNewConcern(text: unknown): boolean {
  const n = normalizeParticipantTextForMode(text)
  if (!n) return false

  if (
    /\b(still worried|worried about|scared|afraid|anxious|nervous|bothering me|something else|another thing)\b/.test(
      n
    )
  ) {
    return true
  }
  if (/\bi (don't|do not) understand\b/.test(n)) return true

  return false
}

/**
 * Quiet affirmative ending suitable for soft close in late phase.
 * Conservative — does not treat bare "thanks" / "ok" as close.
 */
export function isQuietAffirmativeEnding(text: unknown): boolean {
  const n = normalizeParticipantTextForMode(text)
  if (!n) return false
  if (hasUnresolvedQuestion(n) || hasContinuingOrNewConcern(n)) return false

  if (
    /\bi feel (a little |somewhat |much )?better\b/.test(n) ||
    /\bi'?m (feeling )?(a little |somewhat )?better\b/.test(n) ||
    /\bi feel (okay|ok|alright|all right) now\b/.test(n) ||
    /\bthat (helps|helped|was helpful)\b/.test(n)
  ) {
    return true
  }

  return false
}

export type SoftCloseEligibilityInput = {
  phase: ConversationPhase
  participantText: string | null | undefined
}

/**
 * Soft/terminal CLOSE eligibility (prompt behavior only — not DB state).
 *
 * CLOSE when:
 * - no medical/practical/readiness intent
 * - no unresolved question
 * - no continuing/new concern
 * - AND (explicit closing intent OR quiet affirmative in late/closure phase)
 *
 * If uncertain: not eligible → prefer REFLECT over forced CLOSE.
 */
export function isSoftCloseEligible(input: SoftCloseEligibilityInput): boolean {
  const text = input.participantText
  if (isPersonalizedMedicalDecisionRequest(text)) return false
  if (isPracticalSupportRequest(text)) return false
  if (isReadinessToActionSignal(text)) return false
  if (hasUnresolvedQuestion(text)) return false
  if (hasContinuingOrNewConcern(text)) return false

  if (isExplicitClosingIntent(text)) return true

  if (
    input.phase === "closure" &&
    isQuietAffirmativeEnding(text)
  ) {
    return true
  }

  return false
}

/**
 * Phase is soft pacing only.
 * Late/closure phase alone does NOT select CLOSE — that requires soft-close
 * eligibility (explicit close or quiet affirmative without unresolved ask).
 */
function defaultModeForPhase(phase: ConversationPhase): StampleyResponseMode {
  switch (phase) {
    case "opening":
      return "EMPATHY"
    case "exploration":
    case "coping":
    case "closure":
      return "REFLECT"
    default:
      return "EMPATHY"
  }
}

/**
 * Deterministic response-mode selection.
 * Precedence:
 * MEDICAL_BOUNDARY > explicit PRACTICAL_SUPPORT > readiness-to-action
 * (also PRACTICAL_SUPPORT) > soft/explicit CLOSE > phase default.
 * Phase default for late/closure pacing is REFLECT (not forced CLOSE).
 * highStress is intentionally NOT a mode — keep it as an independent modifier.
 *
 * CLARIFY is reserved for a later phase (no weak heuristics here).
 */
export function selectStampleyResponseMode(
  input: SelectStampleyResponseModeInput
): StampleyResponseMode {
  const text = input.participantText

  if (isPersonalizedMedicalDecisionRequest(text)) {
    return "MEDICAL_BOUNDARY"
  }
  if (isPracticalSupportRequest(text)) {
    return "PRACTICAL_SUPPORT"
  }
  if (isReadinessToActionSignal(text)) {
    return "PRACTICAL_SUPPORT"
  }
  if (isSoftCloseEligible({ participantText: text, phase: input.phase })) {
    return "CLOSE"
  }

  return defaultModeForPhase(input.phase)
}

/** Short priority block injected into the turn instruction. */
export function buildResponseModePriorityBlock(
  mode: StampleyResponseMode
): string {
  switch (mode) {
    case "PRACTICAL_SUPPORT":
      return `RESPONSE MODE: PRACTICAL_SUPPORT
PRIORITY (overrides phase pacing, including closure): The participant is asking for actionable support. Answer the newest request first with 1–3 bounded non-clinical options before reflection or wrap-up. Do not force closure this turn.`
    case "MEDICAL_BOUNDARY":
      return `RESPONSE MODE: MEDICAL_BOUNDARY
PRIORITY (overrides phase pacing, including closure): The participant is asking for a personalized medical/treatment decision. Do not diagnose, prescribe, dose, or change treatment. Give a useful clinician/care-team next step instead of only refusing. Do not force closure this turn.`
    case "CLOSE":
      return `RESPONSE MODE: CLOSE
PRIORITY: The participant appears ready to wrap up. Keep validation calm and brief. Do not invent a new problem or push another reflective prompt.`
    case "EMPATHY":
      return `RESPONSE MODE: EMPATHY
PRIORITY: Offer specific emotional acknowledgment tied to what they shared. Follow existing phase pacing.`
    case "REFLECT":
      return `RESPONSE MODE: REFLECT
PRIORITY: Deepen awareness gently. Follow existing phase pacing as soft guidance only — do not jump to closure unless RESPONSE MODE is CLOSE. Prefer acknowledging the newest content over wrap-up.`
    default:
      return `RESPONSE MODE: EMPATHY
PRIORITY: Follow existing phase pacing.`
  }
}
