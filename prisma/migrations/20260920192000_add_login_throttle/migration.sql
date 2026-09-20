-- CreateTable
CREATE TABLE "login_throttles" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "window_start" TIMESTAMP(6) NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "login_throttles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_ip_throttles" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "ip_hash" TEXT NOT NULL,
    "window_start" TIMESTAMP(6) NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "login_ip_throttles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "login_throttles_user_id_ip_hash_key" ON "login_throttles"("user_id", "ip_hash");

-- CreateIndex
CREATE UNIQUE INDEX "login_ip_throttles_ip_hash_key" ON "login_ip_throttles"("ip_hash");

-- AddForeignKey
ALTER TABLE "login_throttles" ADD CONSTRAINT "login_throttles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
