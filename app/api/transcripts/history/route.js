import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import Transcript from "@/models/Transcript";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const transcripts = await Transcript.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ transcripts });
}