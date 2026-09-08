import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  return NextResponse.json({
    hasNextauthSecret: !!process.env.NEXTAUTH_SECRET,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    nextauthUrl: process.env.NEXTAUTH_URL || null,
  });
}
