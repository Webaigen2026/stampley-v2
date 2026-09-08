/**
 * Create an additional ADMIN on the new Neon database.
 *
 * Usage:
 *   NEW_ADMIN_EMAIL='...' NEW_ADMIN_PASSWORD='...' npm run create:admin
 *
 * Does not print secrets. Does not overwrite or promote an existing account.
 * Does not modify scripts/bootstrap-admin.ts.
 */

import { existsSync, readFileSync } from "fs"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import bcrypt from "bcryptjs"
import { PrismaPg } from "@prisma/adapter-pg"
import { Prisma, PrismaClient } from "../lib/generated/prisma/client"

const BCRYPT_COST = 10
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")

function loadEnvFile(filename: string) {
  const path = resolve(root, filename)
  if (!existsSync(path)) return
  const content = readFileSync(path, "utf8")
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

function passwordRequirementErrors(password: string): string[] {
  const errors: string[] = []
  if (password.length < 12) errors.push("at least 12 characters")
  if (!/[A-Z]/.test(password)) errors.push("an uppercase letter")
  if (!/[a-z]/.test(password)) errors.push("a lowercase letter")
  if (!/[0-9]/.test(password)) errors.push("a number")
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("a special character")
  return errors
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  )
}

async function main() {
  loadEnvFile(".env.local")
  loadEnvFile(".env")

  const connectionString = process.env.DATABASE_URL?.trim()
  if (!connectionString) {
    console.error("DATABASE_URL is not set.")
    process.exit(1)
  }

  const emailRaw = process.env.NEW_ADMIN_EMAIL
  if (!emailRaw) {
    console.error("NEW_ADMIN_EMAIL is not set.")
    process.exit(1)
  }

  const email = emailRaw.toLowerCase()
  if (!EMAIL_PATTERN.test(email)) {
    console.error("NEW_ADMIN_EMAIL is not a valid email address.")
    process.exit(1)
  }

  const password = process.env.NEW_ADMIN_PASSWORD
  if (!password) {
    console.error("NEW_ADMIN_PASSWORD is not set.")
    process.exit(1)
  }

  const strengthErrors = passwordRequirementErrors(password)
  if (strengthErrors.length > 0) {
    console.error(
      `NEW_ADMIN_PASSWORD is not strong enough. It must include ${strengthErrors.join(", ")}.`
    )
    process.exit(1)
  }

  const adapter = new PrismaPg({ connectionString })
  const prisma = new PrismaClient({ adapter })

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existing) {
      console.error(
        "An account with this email already exists. No changes were made."
      )
      process.exit(1)
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_COST)

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "ADMIN",
        studyId: null,
      },
    })

    console.log("Admin created successfully.")
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      console.error(
        "An account with this email already exists. No changes were made."
      )
      process.exit(1)
    }
    console.error("Create admin failed.")
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

void main()
