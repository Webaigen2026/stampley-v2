-- Phase 3D.1 additive fail-closed transcript origin.
-- Existing and compatibility rows remain LEGACY_CLIENT (non-authoritative).
-- No backfill to SERVER_AUTHORITATIVE. No transcript rewrite. No drops.

CREATE TYPE "stampley_transcript_origin" AS ENUM ('LEGACY_CLIENT', 'SERVER_AUTHORITATIVE');

ALTER TABLE "stampley_chat_sessions"
ADD COLUMN "transcript_origin" "stampley_transcript_origin" NOT NULL DEFAULT 'LEGACY_CLIENT';
