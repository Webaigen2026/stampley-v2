-- CreateEnum
CREATE TYPE "audit_action" AS ENUM (
  'ADMIN_DASHBOARD_VIEWED',
  'ADMIN_USER_DIRECTORY_VIEWED',
  'ADMIN_PARTICIPANT_PROFILE_VIEWED',
  'ADMIN_PRE_SURVEY_LIST_VIEWED',
  'ADMIN_DDS_LIST_VIEWED',
  'ADMIN_POST_SURVEY_LIST_VIEWED',
  'ADMIN_CHECKIN_LIST_VIEWED',
  'ADMIN_SAFETY_VIEWED',
  'ADMIN_STAMPLEY_TRANSCRIPT_LIST_VIEWED',
  'ADMIN_ANALYTICS_VIEWED',
  'ADMIN_STUDY_KEY_LIST_VIEWED',
  'ADMIN_CHECKIN_EXPORTED',
  'ADMIN_HIGH_STRESS_EXPORTED',
  'ADMIN_STAMPLEY_SESSION_EXPORTED',
  'ADMIN_USER_CREATED',
  'ADMIN_USER_DELETED',
  'ADMIN_ROLE_CHANGED',
  'ADMIN_STUDY_KEY_CREATED',
  'ADMIN_STUDY_KEY_EMAILED',
  'ADMIN_STUDY_KEY_DELETED',
  'AUTH_ADMIN_LOGIN_SUCCEEDED',
  'AUTH_PASSWORD_RESET_COMPLETED',
  'AUTH_ADMIN_ACCESS_DENIED'
);

-- CreateEnum
CREATE TYPE "audit_resource_type" AS ENUM (
  'ADMIN_DASHBOARD',
  'USER',
  'USER_DIRECTORY',
  'PRE_SURVEY',
  'DDS',
  'POST_SURVEY',
  'CHECK_IN',
  'SAFETY',
  'STAMPLEY_SESSION',
  'ANALYTICS',
  'STUDY_KEY',
  'AUTH_SESSION',
  'EXPORT'
);

-- CreateEnum
CREATE TYPE "audit_outcome" AS ENUM ('SUCCESS', 'DENIED', 'FAILED');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "actor_user_id" TEXT,
    "actor_role" "user_role",
    "action" "audit_action" NOT NULL,
    "resource_type" "audit_resource_type" NOT NULL,
    "resource_id" TEXT,
    "subject_user_id" TEXT,
    "outcome" "audit_outcome" NOT NULL,
    "occurred_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "request_id" TEXT,
    "metadata" JSONB,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_audit_logs_occurred_at" ON "audit_logs"("occurred_at" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_logs_actor_occurred_at" ON "audit_logs"("actor_user_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_logs_subject_occurred_at" ON "audit_logs"("subject_user_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_logs_action_occurred_at" ON "audit_logs"("action", "occurred_at" DESC);
