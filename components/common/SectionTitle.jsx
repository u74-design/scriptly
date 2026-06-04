const SectionTitle = ({ badge, title, description }) => {
  return (
    <div className="text-center max-w-3xl mx-auto">
      {badge && (
        <div className="inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
          {badge}
        </div>
      )}

      <h2 className="mt-5 text-4xl md:text-5xl font-bold text-white tracking-tight">
        {title}
      </h2>

      <p className="mt-5 text-zinc-400 text-lg leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default SectionTitle;