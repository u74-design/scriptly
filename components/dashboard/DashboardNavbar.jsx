"use client";
import Logo from "../common/Logo";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
const DashboardNavbar = () => {
  const { user } = useUser();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#09090b]/70 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-12">
        <Logo />
         <div className="hidden md:flex items-center gap-8 text-md text-zinc-400 font-mono">

          <Link href="/" className="hover:text-white transition">
            Home
          </Link>

          <Link href="/features" className="hover:text-white transition">
            Features
          </Link>

          <Link href="/pricing" className="hover:text-white transition">
            Pricing
          </Link>

          <Link href="/docs" className="hover:text-white transition">
            Docs
          </Link>
        </div>
        <div className="flex items-center gap-5 px-4">
          <Link
            href="/pricing"
            className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-fuchsia-500/20 transition hover:scale-[1.03]"
          >
            Upgrade ( soon )
          </Link>

          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-8 py-2 backdrop-blur-xl">

         
              <UserButton afterSignOutUrl="/" />
              <p className="text-sm font-medium text-white">
                  {user
                  ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                  : "User"}
              </p>
                    
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardNavbar;
