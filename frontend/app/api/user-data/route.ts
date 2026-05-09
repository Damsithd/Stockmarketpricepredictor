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
  
  await db.collection("user_data").updateOne(
    { userId: session.user.id },
    { $set: { favorites: body.favorites || [], holdings: body.holdings || [] } },
    { upsert: true }
  );
  
  return NextResponse.json({ success: true });
}
