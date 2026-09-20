-- CreateTable
CREATE TABLE "password_reset_ip_throttles" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "ip_hash" TEXT NOT NULL,
    "window_start" TIMESTAMP(6) NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "password_reset_ip_throttles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_ip_throttles_ip_hash_key" ON "password_reset_ip_throttles"("ip_hash");
