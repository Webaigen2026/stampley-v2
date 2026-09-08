-- AlterTable
ALTER TABLE "check_in_submissions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text,
ALTER COLUMN "context_tags" SET DEFAULT '[]'::jsonb;

-- AlterTable
ALTER TABLE "dds_responses" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "password_reset_tokens" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "post_survey_responses" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "pre_survey_responses" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "reflections" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "stampley_chat_sessions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text,
ALTER COLUMN "messages" SET DEFAULT '[]'::jsonb;

-- AlterTable
ALTER TABLE "study_keys" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "user_study_progress" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "user_weekly_domains" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- CreateTable
CREATE TABLE "registration_verifications" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "study_key" TEXT,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_sent_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registration_verifications_email_key" ON "registration_verifications"("email");

-- CreateIndex
CREATE INDEX "idx_registration_verifications_expires_at" ON "registration_verifications"("expires_at");
