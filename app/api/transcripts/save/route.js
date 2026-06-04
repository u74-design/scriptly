import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import Transcript from "@/models/Transcript";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { userId } = await auth();
  console.log("userId from auth:", userId);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    transcript,
    videoUrl,
    summary,
    notes,
    study,
    ask,
    channelId,
    channelTitle,
    channelUrl,
    sourceType,
  } = await req.json();
  if (!transcript || !videoUrl)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  await connectDB();

  // Avoid duplicates — update and preserve any saved metadata
  const updateFields = {
    transcript,
    saved: true,
    createdAt: new Date(),
  };

  if (typeof summary !== "undefined") {
    updateFields.summary = summary;
  }

  if (typeof notes !== "undefined") {
    updateFields.notes = notes;
  }

  if (typeof study !== "undefined") {
    updateFields.study = study;
  }

  if (typeof ask !== "undefined") {
    updateFields.ask = ask;
  }

  if (typeof channelId !== "undefined") {
    updateFields.channelId = channelId;
  }

  if (typeof channelTitle !== "undefined") {
    updateFields.channelTitle = channelTitle;
  }

  if (typeof channelUrl !== "undefined") {
    updateFields.channelUrl = channelUrl;
  }

  if (typeof sourceType !== "undefined") {
    updateFields.sourceType = sourceType;
  }

  const doc = await Transcript.findOneAndUpdate(
    { userId, videoUrl },
    updateFields,
    { upsert: true, new: true }
  );

  return NextResponse.json({ success: true, id: doc._id });
}
