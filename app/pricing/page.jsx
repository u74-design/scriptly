"use client";

import { Check, Crown, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Script from "next/script";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description:
      "Start extracting and summarizing videos with the essentials.",
    features: [
      "5 summaries/day",
      "TXT export",
      "Basic history",
    ],
    cta: "Start Free",
    href: "/dashboard",
    Icon: Sparkles,
  },
  {
    name: "Pro",
    price: "₹199",
    period: "month",
    description:
      "For serious study, research, and creator workflows.",
    features: [
      "Unlimited",
      "PDF/JSON export",
      "Playlist extraction",
      "Channel extraction",
      "Unlimited history",
      "Premium translation",
    ],
    cta: "Upgrade To Pro",
    Icon: Crown,
    featured: true,
  },
  {
    name: "Creator",
    price: "Custom",
    period: "teams",
    description:
      "For teams that process more videos and need flexible usage.",
    features: [
      "Shared workflows",
      "Bulk transcript exports",
      "Priority processing",
      "Team-ready history",
      "Support for large libraries",
    ],
    cta: "Contact Us",
    href: "/docs",
    Icon: Zap,
  },
];

export default function PricingPage() {
  const handleCheckout = async () => {
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
      });

      const order = await res.json();

      if (!order.id) {
        alert("Failed to create order");
        return;
      }

      const key =
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: "Scriptly",
        description: "Scriptly Pro Plan",
        order_id: order.id,

        handler: function (response) {
          console.log("Payment Success:", response);

          alert("Payment Successful!");
        },

        prefill: {
          name: "",
          email: "",
        },

        theme: {
          color: "#a855f7",
        },
      };

      const razorpay =
        new window.Razorpay(options);

      razorpay.open();
    } catch (err) {
      console.log(err);
      alert("Something went wrong");
    }
  };

  return (
    <main className="min-h-screen bg-[#08090d] text-white">
      {/* Razorpay Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <Navbar />

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-xl border border-fuchsia-400/25 bg-fuchsia-500/10 px-3 py-1.5 text-xs font-medium text-fuchsia-300">
            <Crown size={14} />
            Pricing
          </div>

          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Choose the plan that fits your video workflow.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-zinc-500">
            Start free, then upgrade when you need
            unlimited summaries, bulk extraction,
            exports, history, and premium translation.
          </p>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
          {plans.map(
            ({
              name,
              price,
              period,
              description,
              features,
              cta,
              href,
              Icon,
              featured,
            }) => (
              <article
                key={name}
                className={`relative rounded-2xl border p-6 ${
                  featured
                    ? "border-fuchsia-400/35 bg-gradient-to-b from-fuchsia-500/15 to-cyan-500/5 shadow-2xl shadow-fuchsia-500/10"
                    : "border-white/[0.08] bg-white/[0.03]"
                }`}
              >
                {featured && (
                  <div className="absolute right-5 top-5 rounded-lg border border-fuchsia-400/25 bg-fuchsia-500/15 px-2.5 py-1 text-[11px] font-medium text-fuchsia-200">
                    Popular
                  </div>
                )}

                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                  <Icon
                    size={20}
                    className="text-cyan-300"
                  />
                </div>

                <h2 className="text-2xl font-bold text-white">
                  {name}
                </h2>

                <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-500">
                  {description}
                </p>

                <div className="mt-7 flex items-end gap-2">
                  <span className="text-4xl font-bold">
                    {price}
                  </span>
                  <span className="pb-1 text-sm text-zinc-500">
                    /{period}
                  </span>
                </div>

                {/* Button Area */}
                {featured ? (
                  <button
                    onClick={handleCheckout}
                    className="mt-7 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-fuchsia-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    {cta}
                  </button>
                ) : (
                  <Link
                    href={href}
                    className="mt-7 flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
                  >
                    {cta}
                  </Link>
                )}

                <div className="mt-7 space-y-3">
                  {features.map((feature) => (
                    <p
                      key={feature}
                      className="flex gap-3 text-sm leading-6 text-zinc-400"
                    >
                      <Check
                        size={16}
                        className="mt-0.5 shrink-0 text-cyan-300"
                      />
                      {feature}
                    </p>
                  ))}
                </div>
              </article>
            )
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}