"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function submitPreSurvey(data: any) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

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

  await prisma.preSurveyResponse.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      ...values,
    },
    update: values,
  });

  return { success: true };
}
