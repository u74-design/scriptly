import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import Transcript from "@/models/Transcript";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Transcript ID required" }, { status: 400 });

  await connectDB();
  const result = await Transcript.updateOne(
    { _id: id, userId },
    { saved: false }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Saved transcript not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
