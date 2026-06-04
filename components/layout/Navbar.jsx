"use client";

import Logo from "../common/Logo";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";

const Navbar = () => {
  const { isSignedIn } = useUser();
  const { user } = useUser();
  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/30 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
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
            Policies
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {!isSignedIn ? (
            <>
              <Link
                href="/sign-in"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/10"
              >
                Sign In
              </Link>

              <Link
                href="/sign-up"
                className="rounded-xl bg-violet-600 px-4 py-3 font-mono transition hover:bg-violet-500"
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="rounded-xl bg-violet-600 px-4 py-3 font-mono transition hover:bg-violet-500"
              >
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
              <p className="text-sm font-medium text-white">
                {user
                  ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                  : "User"}
              </p>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
