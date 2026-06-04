import ToolPageShell from "@/components/dashboard/ToolPageShell";
import BulkTranscriptTool from "@/components/transcript/BulkTranscriptTool";

export default function PlaylistPage() {
  return (
    <ToolPageShell>
      <BulkTranscriptTool type="playlist" />
    </ToolPageShell>
  );
}
