"use client";

import { useState } from "react";
import {
  Sparkles,
  Clock,
  List,
  AlignLeft,
} from "lucide-react";

const TABS = [
  { id: "timestamps", label: "Timestamps", Icon: Clock },
  { id: "keypoints", label: "Key Points", Icon: List },
  { id: "overview", label: "Overview", Icon: AlignLeft },
];

const TimestampItem = ({ item, isLast }) => (
  <div className="flex gap-3">
    <div className="flex flex-col items-center">
      <div className="mt-1 h-2 w-2 rounded-full bg-fuchsia-500" />
      {!isLast && <div className="mt-1 flex-1 w-px bg-fuchsia-500/20" />}
    </div>

    <div className="pb-5">
      <span className="mb-1 block font-mono text-[11px] font-semibold tracking-widest text-fuchsia-400">
        {item.timestamp}
      </span>

      <p className="mb-1 text-sm font-medium text-zinc-200">{item.heading}</p>

      <p className="text-xs leading-relaxed text-zinc-500">
        {item.description}
      </p>
    </div>
  </div>
);

const KeyPointItem = ({ index, text }) => (
  <div className="flex gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-fuchsia-500/15 text-[11px] font-semibold text-fuchsia-400">
      {index}
    </span>

    <p className="text-xs leading-relaxed text-zinc-400">{text}</p>
  </div>
);

const SummaryPanel = ({ data }) => {
  const [activeTab, setActiveTab] = useState("timestamps");

  if (!data) return null;

  return (
    <div className="flex h-full min-h-[75vh] flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Summary</h2>
            <span className="flex items-center gap-1 rounded-md border border-fuchsia-500/25 bg-fuchsia-500/10 px-2 py-0.5 text-[11px] text-fuchsia-400">
              <Sparkles size={10} />
              AI
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {data.timestamps?.length || 0} key moments
          </p>
        </div>
      </div>

      <div className="mb-4 flex gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all ${
              activeTab === id
                ? "bg-fuchsia-500/15 text-fuchsia-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {activeTab === "timestamps" && (
          <div className="pt-1">
            {data.timestamps?.map((item, i) => (
              <TimestampItem
                key={i}
                item={item}
                isLast={i === data.timestamps.length - 1}
              />
            ))}
          </div>
        )}

        {activeTab === "keypoints" && (
          <div className="flex flex-col gap-2 pt-1">
            {data.keyPoints?.map((text, i) => (
              <KeyPointItem key={i} index={i + 1} text={text} />
            ))}
          </div>
        )}

        {activeTab === "overview" && (
          <div className="space-y-4 pt-1">
            {data.overview?.split("\n\n").map((para, i) => (
              <p key={i} className="text-sm leading-7 text-zinc-400">
                {para}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryPanel;
