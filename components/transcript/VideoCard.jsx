"use client";

/**
 * VideoCard — smaller thumbnail, centred YouTube play button, links to video.
 */
const VideoCard = ({ title, thumbnail, videoUrl, previewOnly = false }) => {
  if (previewOnly) {
    return (
      <a
        href={videoUrl || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block w-full max-w-[300px] overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-900 shadow-2xl shadow-black/30"
        aria-label="Watch on YouTube"
        style={{ aspectRatio: "16/9" }}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title || "Video thumbnail"}
            className="h-full w-full object-cover transition duration-300 group-hover:brightness-75"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
        )}

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 shadow-xl transition duration-200 group-hover:scale-110 group-hover:bg-red-500">
            <svg viewBox="0 0 24 24" fill="white" className="h-7 w-7 translate-x-0.5" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </a>
    );
  }

  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">

      <div className="flex flex-col gap-4 p-4 sm:flex-row">
        <a
          href={videoUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative w-full flex-shrink-0 overflow-hidden rounded-xl bg-zinc-900 sm:w-48"
          aria-label="Watch on YouTube"
          style={{ aspectRatio: "16/9" }}
        >
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title || "Video thumbnail"}
              className="h-full w-full object-cover transition duration-300 group-hover:brightness-75"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
          )}

          {/* Red play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 shadow-xl transition duration-200 group-hover:scale-110 group-hover:bg-red-500">
              <svg viewBox="0 0 24 24" fill="white" className="h-5 w-5 translate-x-0.5" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </a>

        {/* Meta info */}
        {/* <div className="flex flex-col justify-center gap-1 min-w-0">
          <p className="text-sm font-medium text-zinc-200 line-clamp-2">
            {title || "YouTube Video"}
          </p>
          <p className="truncate text-xs text-zinc-500" title={videoUrl}>
            {videoUrl}
          </p>
          <a
            href={videoUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 text-xs text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Watch on YouTube
          </a>
        </div> */}

      </div>
    </div>
  );
};

export default VideoCard;
