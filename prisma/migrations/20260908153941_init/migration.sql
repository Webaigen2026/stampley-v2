-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'PARTICIPANT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'PARTICIPANT',
    "study_id" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_keys" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "key" TEXT NOT NULL,
    "is_used" BOOLEAN DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_in_submissions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "subscale" TEXT NOT NULL,
    "distress" INTEGER NOT NULL,
    "mood" INTEGER,
    "energy" INTEGER,
    "reflection" TEXT,
    "coping_action" TEXT,
    "context_tags" JSONB DEFAULT '[]'::jsonb,
    "needs_safety_escalation" BOOLEAN DEFAULT false,
    "consecutive_high_distress_days" INTEGER DEFAULT 0,
    "week_number" INTEGER DEFAULT 1,
    "day_number" INTEGER DEFAULT 1,
    "check_in_date" DATE DEFAULT CURRENT_DATE,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "check_in_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stampley_chat_sessions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL,
    "check_in_submission_id" TEXT,
    "domain" TEXT,
    "stress_level" INTEGER,
    "mood" INTEGER,
    "energy" INTEGER,
    "user_message_count" INTEGER DEFAULT 0,
    "assistant_message_count" INTEGER DEFAULT 0,
    "summary" TEXT,
    "messages" JSONB DEFAULT '[]'::jsonb,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stampley_chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reflections" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reflections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dds_responses" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL,
    "q1" INTEGER,
    "q2" INTEGER,
    "q3" INTEGER,
    "q4" INTEGER,
    "q5" INTEGER,
    "q6" INTEGER,
    "q7" INTEGER,
    "q8" INTEGER,
    "q9" INTEGER,
    "q10" INTEGER,
    "q11" INTEGER,
    "q12" INTEGER,
    "q13" INTEGER,
    "q14" INTEGER,
    "q15" INTEGER,
    "q16" INTEGER,
    "q17" INTEGER,
    "emotional_score" DECIMAL,
    "physician_score" DECIMAL,
    "regimen_score" DECIMAL,
    "interpersonal_score" DECIMAL,
    "total_score" DECIMAL,
    "recommended_domain" TEXT,
    "confirmed_domain" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dds_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_weekly_domains" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL,
    "week_number" INTEGER NOT NULL,
    "domain" TEXT NOT NULL,
    "started_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_weekly_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_study_progress" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL,
    "study_start_date" DATE DEFAULT CURRENT_DATE,
    "current_week" INTEGER DEFAULT 1,
    "total_checkins" INTEGER DEFAULT 0,
    "last_checkin_date" DATE,
    "consecutive_high_distress_days" INTEGER DEFAULT 0,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_study_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_survey_responses" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL,
    "dds_answers" JSONB,
    "dds_scores" JSONB,
    "phq_answers" JSONB,
    "phq_total" INTEGER,
    "phq_severity" TEXT,
    "sus_answers" JSONB,
    "sus_score" DECIMAL,
    "stampley_feedback" JSONB,
    "open_reflection" TEXT,
    "future_research_contact" BOOLEAN,
    "contact_name" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "completed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pre_survey_responses" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL,
    "consent_status" TEXT,
    "diagnosis_verified" BOOLEAN,
    "diagnosis_file_url" TEXT,
    "diagnosis_duration" TEXT,
    "age" INTEGER,
    "gender" TEXT,
    "race" TEXT[],
    "ethnicity" TEXT,
    "marital_status" TEXT,
    "education" TEXT,
    "employment_status" TEXT,
    "household_income" TEXT,
    "insurance_type" TEXT,
    "medical_forms_confidence" TEXT,
    "reading_help_frequency" TEXT,
    "diabetes_duration" TEXT,
    "current_treatments" TEXT[],
    "attended_diabetes_classes" BOOLEAN,
    "diabetes_tools_used" TEXT[],
    "overall_health_rating" TEXT,
    "owns_smartphone" BOOLEAN,
    "internet_usage" TEXT,
    "app_comfort" TEXT,
    "telehealth_used" BOOLEAN,
    "mental_health_apps_used" BOOLEAN,
    "smartphone_app_comfort" INTEGER,
    "digital_health_tools_used" BOOLEAN,
    "voice_tech_comfort" INTEGER,
    "communication_preference" TEXT,
    "phq1" INTEGER,
    "phq2" INTEGER,
    "phq3" INTEGER,
    "phq4" INTEGER,
    "phq5" INTEGER,
    "phq6" INTEGER,
    "phq7" INTEGER,
    "phq8" INTEGER,
    "phq9" INTEGER,
    "phq_total" INTEGER,
    "phq_severity" TEXT,
    "needs_mental_health_followup" BOOLEAN,
    "completed_at" TIMESTAMP(6),

    CONSTRAINT "pre_survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_study_id_key" ON "users"("study_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_keys_key_key" ON "study_keys"("key");

-- CreateIndex
CREATE UNIQUE INDEX "check_in_submissions_user_id_check_in_date_key" ON "check_in_submissions"("user_id", "check_in_date");

-- CreateIndex
CREATE INDEX "idx_stampley_chat_sessions_user_id" ON "stampley_chat_sessions"("user_id");

-- CreateIndex
CREATE INDEX "idx_stampley_chat_sessions_created_at" ON "stampley_chat_sessions"("created_at");

-- CreateIndex
CREATE INDEX "idx_stampley_chat_sessions_check_in_submission_id" ON "stampley_chat_sessions"("check_in_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "dds_responses_user_id_key" ON "dds_responses"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_weekly_domains_user_id_week_number_key" ON "user_weekly_domains"("user_id", "week_number");

-- CreateIndex
CREATE UNIQUE INDEX "user_study_progress_user_id_key" ON "user_study_progress"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_survey_responses_user_id_key" ON "post_survey_responses"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "pre_survey_responses_user_id_key" ON "pre_survey_responses"("user_id");

-- AddForeignKey
ALTER TABLE "check_in_submissions" ADD CONSTRAINT "check_in_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stampley_chat_sessions" ADD CONSTRAINT "stampley_chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stampley_chat_sessions" ADD CONSTRAINT "stampley_chat_sessions_check_in_submission_id_fkey" FOREIGN KEY ("check_in_submission_id") REFERENCES "check_in_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reflections" ADD CONSTRAINT "reflections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dds_responses" ADD CONSTRAINT "dds_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_weekly_domains" ADD CONSTRAINT "user_weekly_domains_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_study_progress" ADD CONSTRAINT "user_study_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_survey_responses" ADD CONSTRAINT "post_survey_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_survey_responses" ADD CONSTRAINT "pre_survey_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
