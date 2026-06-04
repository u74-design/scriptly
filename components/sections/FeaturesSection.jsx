import {
  FileText,
  ListVideo,
  Tv,
  Zap,
  Download,
  Sparkles,
} from "lucide-react";

import FeatureCard from "../common/FeatureCard";
import SectionTitle from "../common/SectionTitle";

const features = [
  {
    icon: FileText,
    title: "Single Video Extraction",
    description: "Extract transcripts from any YouTube video instantly.",
  },
  {
    icon: ListVideo,
    title: "Playlist Processing",
    description: "Generate transcripts across entire playlists.",
  },
  {
    icon: Tv,
    title: "Channel Extraction",
    description: "Bulk transcript workflows for complete channels.",
  },
  {
    icon: Zap,
    title: "Fast Processing",
    description: "Built with scalable processing workflows.",
  },
  {
    icon: Download,
    title: "Export & Download",
    description: "Save transcripts in multiple formats.",
  },
  {
    icon: Sparkles,
    title: "AI Workflow Ready",
    description: "Prepared for future AI summaries and search."
  },
];

const FeaturesSection = () => {
  return (
    <section className="pb-28 px-6">
      <SectionTitle
        badge="Features"
        title="Everything Needed for Transcript Workflows"
        description="Designed to simplify transcript extraction and management at scale."
      />

      <div className="mt-16 mx-auto max-w-6xl grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            badge={feature.badge}
          />
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;