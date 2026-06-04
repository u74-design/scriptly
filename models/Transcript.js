import mongoose from "mongoose";

const TranscriptSchema = new mongoose.Schema({
  userId:       { type: String, required: true, index: true },
  videoUrl:     { type: String, required: true },
  transcript:   { type: String, required: true },
  summary:      { type: Object, default: null },
  notes:        { type: Object, default: null },
  study:        { type: Object, default: null },
  ask:          { type: Array, default: [] },
  channelId:    { type: String, default: null },
  channelTitle: { type: String, default: null },
  channelUrl:   { type: String, default: null },
  sourceType:   { type: String, default: "video" },
  saved:        { type: Boolean, default: false },
  createdAt:    { type: Date, default: Date.now },
});

export default mongoose.models.Transcript ||
  mongoose.model("Transcript", TranscriptSchema);
