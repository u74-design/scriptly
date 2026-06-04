"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Bookmark,
  History,
  ListVideo,
  Lock,
  Menu,
  PanelLeftClose,
  PlusSquare,
  RadioTower,
  Zap,
} from "lucide-react";
import Logo from "@/components/common/Logo";
import AuthPromptModal from "@/components/models/AuthPromptModal";

const WORKSPACE_NAV = [
  { label: "New Transcript", icon: PlusSquare, href: "/dashboard", protected: false },
  { label: "History", icon: History, href: "/dashboard/history", protected: true },
  { label: "Saved", icon: Bookmark, href: "/dashboard/saved", protected: true },
];

const TOOLS_NAV = [
  { label: "AI Study Tools", icon: Zap, href: "/dashboard", protected: false },
  { label: "Playlist Processing", icon: ListVideo, href: "/dashboard/playlist", protected: true },
  { label: "Channel Extraction", icon: RadioTower, href: "/dashboard/channel", protected: true },
];

const NavButton = ({ expanded, item, isActive, isLocked, onClick }) => (
  <button
    onClick={onClick}
    title={item.label}
    aria-label={item.label}
    className={`group relative flex items-center transition-all duration-200 ${
      expanded
        ? "h-11 w-full gap-3 rounded-xl px-3 text-sm"
        : "h-11 w-11 justify-center rounded-xl"
    } ${
      isActive
        ? "bg-fuchsia-500/15 text-fuchsia-300 shadow-lg shadow-fuchsia-500/10"
        : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200"
    }`}
  >
    {isActive && (
      <span className="absolute left-0 h-6 w-0.5 rounded-r-full bg-fuchsia-300" />
    )}
    <item.icon size={19} className="shrink-0" />
    {expanded && <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>}
    {isLocked && (
      <Lock
        size={expanded ? 13 : 11}
        className={expanded ? "text-zinc-600" : "absolute right-1.5 top-1.5 text-zinc-600"}
      />
    )}
  </button>
);

const Sidebar = ({ isOpen, expanded = false, onExpandedChange }) => {
  const { isSignedIn } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [modal, setModal] = useState(null);

  const controlled = isOpen !== undefined;
  const visible = controlled ? isOpen : true;
  const width = expanded ? "w-72" : "w-16";

  const handleNav = (item) => {
    if (item.protected && !isSignedIn) {
      setModal(`Sign in to access ${item.label.toLowerCase()}.`);
      return;
    }
    router.push(item.href);
  };

  return (
    <>
      {modal && (
        <AuthPromptModal message={modal} onClose={() => setModal(null)} />
      )}

      <aside
        className={`fixed left-0 top-16 z-30 h-[calc(100vh-64px)] ${width} border-r border-white/[0.08] bg-[#0b1020]/95 transition-all duration-300 ${
          visible ? "translate-x-0" : "-translate-x-full"
        } ${controlled ? "block" : "hidden lg:block"}`}
      >
        <div className={`flex h-full flex-col overflow-y-auto px-2 py-4 ${expanded ? "items-stretch" : "items-center"}`}>
          <div className={`mb-5 flex items-center ${expanded ? "justify-between gap-3 px-2" : "justify-center"}`}>
            {expanded ? (
              <>
                <Logo />
                <button
                  type="button"
                  onClick={() => onExpandedChange?.(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
                  aria-label="Hide sidebar labels"
                  title="Hide"
                >
                  <PanelLeftClose size={18} />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onExpandedChange?.(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
                aria-label="Show sidebar labels"
                title="Show"
              >
                <Menu size={18} />
              </button>
            )}
          </div>

          {expanded && (
            <p className="mb-3 px-3 text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-600">
              Workspace
            </p>
          )}
          <nav className={`flex flex-col gap-2 ${expanded ? "" : "items-center"}`}>
            {WORKSPACE_NAV.map((item) => (
              <NavButton
                key={item.href}
                expanded={expanded}
                item={item}
                isActive={pathname === item.href}
                isLocked={item.protected && !isSignedIn}
                onClick={() => handleNav(item)}
              />
            ))}
          </nav>

          <div className={expanded ? "my-5 h-px bg-white/[0.08]" : "my-4 h-px w-8 bg-white/[0.08]"} />

          {expanded && (
            <p className="mb-3 px-3 text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-600">
              More Tools
            </p>
          )}
          <nav className={`flex flex-col gap-2 ${expanded ? "" : "items-center"}`}>
            {TOOLS_NAV.map((item) => (
              <NavButton
                key={item.href}
                expanded={expanded}
                item={item}
                isActive={pathname === item.href}
                isLocked={item.protected && !isSignedIn}
                onClick={() => handleNav(item)}
              />
            ))}
          </nav>

          {!expanded && (
            <div className="mt-auto flex h-12 w-9 items-center justify-center">
              <div className="h-9 w-1 rounded-full bg-white/45" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
