-- AlterTable
-- Nullable BOOLEAN matches PreSurveyResponse.needs_mental_health_followup.
-- Existing historical rows remain NULL (not evaluated under this column).
-- New submissions always write an explicit true/false from server-validated PHQ.
ALTER TABLE "post_survey_responses"
ADD COLUMN "needs_mental_health_followup" BOOLEAN;
