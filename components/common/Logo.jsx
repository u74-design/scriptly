import { Sparkles } from "lucide-react";

const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/20">
        <Sparkles className="h-5 w-5 text-violet-400" />
      </div>

      <h1 className="text-xl font-semibold tracking-tight text-white font-sans">
        Scriptly
      </h1>
    </div>
  );
};

export default Logo;