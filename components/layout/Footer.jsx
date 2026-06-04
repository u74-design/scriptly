import Logo from "../common/Logo";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="border-t border-white/5 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col md:flex-row items-center justify-between gap-6">

        <Logo />

        <div className="flex items-center gap-6 text-sm text-zinc-500 font-mono">
          <Link href="/features" className="hover:text-white transition">
            Features
          </Link>

          <Link href="/docs" className="hover:text-white transition">
            Docs
          </Link>

          <Link href="/pricing" className="hover:text-white transition">
            Pricing
          </Link>
        </div>

        <p className="text-sm text-zinc-500 font-sans">
          © 2026 Scriptly. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
