"use client";

import { useState } from "react";

const TranscriptInput = ({
  onSubmit,
  initialUrl = "",
  compact = false,
}) => {
  const [url, setUrl] =
    useState(initialUrl);
    const [Sidebar, setSidebar] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!url.trim()) return;

    onSubmit(url);
  };

  
  return (
    <div className={compact ? "" : "rounded-2xl border border-white/10 bg-white/5 p-6"}>

      {!compact && (
        <h2 className="mb-4 text-2xl font-bold">
          Paste YouTube URL
        </h2>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 md:flex-row"
      >
        <input
          type="text"
          placeholder="https://youtube.com/watch?v=..."
          value={url}
          onChange={(e) =>
            setUrl(e.target.value)
          }
          className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-4 text-sm outline-none transition focus:border-fuchsia-500"
        />

        <button
          type="submit"
          className="rounded-xl bg-white px-6 py-4 font-semibold text-black transition hover:scale-[1.02]"
        >
          Generate
        </button>
      </form>
    </div>
  );
};

export default TranscriptInput;
