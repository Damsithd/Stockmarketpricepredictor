import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const userData = await db.collection("user_data").findOne({ userId: session.user.id });
  return NextResponse.json(userData || { favorites: [], holdings: [] });
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = await getDb();

  // Only update the fields that were actually sent — avoids one page
  // overwriting the other's data with an empty array.
  const fieldsToSet: Record<string, unknown> = {};
  if (body.favorites !== undefined) fieldsToSet.favorites = body.favorites;
  if (body.holdings  !== undefined) fieldsToSet.holdings  = body.holdings;

  if (Object.keys(fieldsToSet).length === 0) {
    return NextResponse.json({ error: "No data provided" }, { status: 400 });
  }

  await db.collection("user_data").updateOne(
    { userId: session.user.id },
    { $set: fieldsToSet },
    { upsert: true }
  );

  return NextResponse.json({ success: true });
}
