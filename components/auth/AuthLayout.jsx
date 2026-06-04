import Logo from "../common/Logo";

const AuthLayout = ({
  title,
  subtitle,
  children,
}) => {
  return (
    <div className="min-h-screen bg-[#08090d] text-white flex">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden border-r border-white/5">

        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-14 w-full">

          <div>
            <Logo />

            <div className="mt-16">
              <h1 className="text-5xl font-bold leading-tight">
                Turn Videos Into
                <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  {" "}Structured Knowledge
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-8 text-zinc-400">
                Extract transcripts, search instantly,
                organize research and save hours
                using Scriptly.
              </p>
            </div>
          </div>

          <div className="space-y-4 mt-3">

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="font-medium">
                Bulk Playlist Extraction
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Process channels & playlists
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="font-medium">
                AI Search & Summary
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Find exact insights instantly
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="font-medium">
                Premium Workspace
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Save & manage transcripts
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex flex-1 items-center justify-center px-6">

        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold">
            {title}
          </h2>

          <p className="mt-2 text-zinc-400">
            {subtitle}
          </p>

          <div className="mt-8">
            {children}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthLayout;