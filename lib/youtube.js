import { YoutubeTranscript } from "youtube-transcript";

export async function getTranscript(videoId) {
  try {
    const transcript =
      await YoutubeTranscript.fetchTranscript(videoId);

    return transcript;
  } catch (error) {
    console.log(error);

    throw new Error("Failed to fetch transcript");
  }
}