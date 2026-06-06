import { fetchRawTranscriptSegments } from "@/lib/transcript-fetch";

export async function getTranscript(videoId) {
  try {
    const { segments } = await fetchRawTranscriptSegments(videoId);
    return segments;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch transcript");
  }
}
