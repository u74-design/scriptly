"use client";

import { BookOpen } from "lucide-react";

export default function NotesPanel({ data }) {
  if (!data) return null;

  return (
    <div className="space-y-4">
      {data.title && (
        <div>
          <h3 className="text-lg font-semibold text-white">{data.title}</h3>
          {data.summary && (
            <p className="mt-2 text-sm leading-7 text-zinc-400">{data.summary}</p>
          )}
        </div>
      )}

      {data.sections?.map((section, index) => (
        <section key={index} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
          <h4 className="mb-3 text-sm font-semibold text-cyan-200">{section.heading}</h4>
          <div className="space-y-2">
            {section.bullets?.map((bullet, i) => (
              <p key={i} className="flex gap-2 text-sm leading-6 text-zinc-400">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                {bullet}
              </p>
            ))}
          </div>
        </section>
      ))}

      {data.definitions?.length > 0 && (
        <section>
          <h4 className="mb-3 text-sm font-semibold text-white">Definitions</h4>
          <div className="grid gap-2">
            {data.definitions.map((item, index) => (
              <div key={index} className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                  {item.term}
                </p>
                <p className="mt-1 text-sm leading-6 text-zinc-400">{item.meaning}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.actionItems?.length > 0 && (
        <section>
          <h4 className="mb-3 text-sm font-semibold text-white flex items-center gap-2">
            <BookOpen size={16} />
            Action Items
          </h4>
          <div className="space-y-2">
            {data.actionItems.map((item, index) => (
              <p key={index} className="flex gap-2 text-sm leading-6 text-zinc-400">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-400" />
                {item}
              </p>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
