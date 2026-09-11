"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";

const INVALID_SUBMISSION = "Invalid pre-survey submission";
const ALREADY_COMPLETED = "Pre-survey already completed";

function isFilledString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "string")
  );
}

function isValidAge(value: unknown): boolean {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return false;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed > 0;
  }

  return false;
}

function isValidComfortScale(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 10
  );
}

function isValidPhqScore(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 3
  );
}

function assertValidPreSurveySubmission(data: unknown): void {
  if (data === null || typeof data !== "object") {
    throw new Error(INVALID_SUBMISSION);
  }

  const payload = data as Record<string, unknown>;

  if (payload.consent_status !== "I consent to participate") {
    throw new Error(INVALID_SUBMISSION);
  }

  if (!isFilledString(payload.diagnosis_duration)) {
    throw new Error(INVALID_SUBMISSION);
  }
  if (!isValidAge(payload.age)) {
    throw new Error(INVALID_SUBMISSION);
  }
  if (!isFilledString(payload.gender)) {
    throw new Error(INVALID_SUBMISSION);
  }
  if (!isNonEmptyStringArray(payload.race)) {
    throw new Error(INVALID_SUBMISSION);
  }
  if (!isFilledString(payload.ethnicity)) {
    throw new Error(INVALID_SUBMISSION);
  }
  if (!isFilledString(payload.marital_status)) {
    throw new Error(INVALID_SUBMISSION);
  }
  if (!isFilledString(payload.education)) {
    throw new Error(INVALID_SUBMISSION);
  }
  if (!isFilledString(payload.employment_status)) {
    throw new Error(INVALID_SUBMISSION);
  }
  if (!isFilledString(payload.household_income)) {
    throw new Error(INVALID_SUBMISSION);
  }
  if (!isFilledString(payload.insurance_type)) {
    throw new Error(INVALID_SUBMISSION);
  }

  if (!isFilledString(payload.medical_forms_confidence)) {
    throw new Error(INVALID_SUBMISSION);
  }
  if (!isFilledString(payload.reading_help_frequency)) {
    throw new Error(INVALID_SUBMISSION);
  }

  if (!isFilledString(payload.diabetes_duration)) {
    throw new Error(INVALID_SUBMISSION);
  }
  if (!isNonEmptyStringArray(payload.current_treatments)) {
    throw new Error(INVALID_SUBMISSION);
  }
  if (typeof payload.attended_diabetes_classes !== "boolean") {
    throw new Error(INVALID_SUBMISSION);
  }
  if (!isNonEmptyStringArray(payload.diabetes_tools_used)) {
    throw new Error(INVALID_SUBMISSION);
  }
  if (!isFilledString(payload.overall_health_rating)) {
    throw new Error(INVALID_SUBMISSION);
  }

  if (typeof payload.owns_smartphone !== "boolean") {
    throw new Error(INVALID_SUBMISSION);
  }
  if (!isFilledString(payload.internet_usage)) {
    throw new Error(INVALID_SUBMISSION);
  }
  if (!isFilledString(payload.app_comfort)) {
    throw new Error(INVALID_SUBMISSION);
  }
  if (typeof payload.telehealth_used !== "boolean") {
    throw new Error(INVALID_SUBMISSION);
  }
  if (typeof payload.mental_health_apps_used !== "boolean") {
    throw new Error(INVALID_SUBMISSION);
  }
  if (!isValidComfortScale(payload.smartphone_app_comfort)) {
    throw new Error(INVALID_SUBMISSION);
  }
  if (typeof payload.digital_health_tools_used !== "boolean") {
    throw new Error(INVALID_SUBMISSION);
  }
  if (!isValidComfortScale(payload.voice_tech_comfort)) {
    throw new Error(INVALID_SUBMISSION);
  }
  if (!isFilledString(payload.communication_preference)) {
    throw new Error(INVALID_SUBMISSION);
  }

  for (let i = 1; i <= 9; i++) {
    if (!isValidPhqScore(payload[`phq${i}`])) {
      throw new Error(INVALID_SUBMISSION);
    }
  }
}

export async function submitPreSurvey(data: any) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (session.user.role !== "PARTICIPANT") {
    throw new Error("Unauthorized");
  }

  const existing = await prisma.preSurveyResponse.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (existing) {
    throw new Error(ALREADY_COMPLETED);
  }

  assertValidPreSurveySubmission(data);

  const phqTotal =
    Number(data.phq1) +
    Number(data.phq2) +
    Number(data.phq3) +
    Number(data.phq4) +
    Number(data.phq5) +
    Number(data.phq6) +
    Number(data.phq7) +
    Number(data.phq8) +
    Number(data.phq9);

  const phqSeverity =
    phqTotal <= 4 ? "Minimal" :
    phqTotal <= 9 ? "Mild" :
    phqTotal <= 14 ? "Moderate" :
    phqTotal <= 19 ? "Moderately Severe" :
    "Severe";

  const needsFollowup = Number(data.phq9) > 0 || phqTotal >= 15;

  const completedAt = new Date();
  const values = {
    consentStatus: data.consent_status,
    diagnosisVerified: data.diagnosis_verified,
    diagnosisFileUrl: data.diagnosis_file_url,
    diagnosisDuration: data.diagnosis_duration,
    age: Number(data.age),
    gender: data.gender,
    race: data.race,
    ethnicity: data.ethnicity,
    maritalStatus: data.marital_status,
    education: data.education,
    employmentStatus: data.employment_status,
    householdIncome: data.household_income,
    insuranceType: data.insurance_type,
    medicalFormsConfidence: data.medical_forms_confidence,
    readingHelpFrequency: data.reading_help_frequency,
    diabetesDuration: data.diabetes_duration,
    currentTreatments: data.current_treatments,
    attendedDiabetesClasses: data.attended_diabetes_classes,
    diabetesToolsUsed: data.diabetes_tools_used,
    overallHealthRating: data.overall_health_rating,
    ownsSmartphone: data.owns_smartphone,
    internetUsage: data.internet_usage,
    appComfort: data.app_comfort,
    telehealthUsed: data.telehealth_used,
    mentalHealthAppsUsed: data.mental_health_apps_used,
    smartphoneAppComfort: data.smartphone_app_comfort,
    digitalHealthToolsUsed: data.digital_health_tools_used,
    voiceTechComfort: data.voice_tech_comfort,
    communicationPreference: data.communication_preference,
    phq1: data.phq1,
    phq2: data.phq2,
    phq3: data.phq3,
    phq4: data.phq4,
    phq5: data.phq5,
    phq6: data.phq6,
    phq7: data.phq7,
    phq8: data.phq8,
    phq9: data.phq9,
    phqTotal,
    phqSeverity,
    needsMentalHealthFollowup: needsFollowup,
    completedAt,
  };

  try {
    await prisma.preSurveyResponse.create({
      data: {
        userId: session.user.id,
        ...values,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error(ALREADY_COMPLETED);
    }

    throw error;
  }

  return { success: true };
}
