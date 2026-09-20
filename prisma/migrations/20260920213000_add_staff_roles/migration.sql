-- HIPAA-4 additive UserRole values only.
-- Does not rewrite users, backfill roles, increment authVersion,
-- or modify AuditLog / PHI tables.

ALTER TYPE "user_role" ADD VALUE 'STUDY_COORDINATOR';
ALTER TYPE "user_role" ADD VALUE 'CLINICAL_REVIEWER';
