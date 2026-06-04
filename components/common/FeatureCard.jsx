const FeatureCard = ({ icon: Icon, title, description, badge }) => {
  return (
    <div className="group rounded-3xl border border-white/5 bg-zinc-950/70 p-7 transition-all duration-300 hover:border-violet-500/20 hover:bg-zinc-900 hover:-translate-y-1">

      <div className="flex items-start justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/15 transition group-hover:bg-violet-500/15">
          <Icon className="h-7 w-7 text-violet-400" />
        </div>

        {/* Badge */}
        {badge === "soon" && (
          <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-400">
            Soon
          </span>
        )}
        {badge === "upgrade" && (
          <span className="rounded-full border border-fuchsia-500/30 bg-gradient-to-r from-fuchsia-500/20 to-violet-500/20 px-3 py-1 text-xs font-semibold">
            <span className="bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
              ✦ Upgrade
            </span>
          </span>
        )}
      </div>

      <h3 className="mt-6 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
};

export default FeatureCard;