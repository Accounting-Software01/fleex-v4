"use client";

import { Bell, Check, Crown, Sparkles } from "lucide-react";
import DashboardHeader from "@/components/dashboard/layout/dashboard-header";

const plannedFeatures = [
  "Unlimited Forges",
  "Advanced creator analytics",
  "Team collaboration",
  "HD video uploads",
  "Advanced customization",
  "Priority discovery tools",
];

export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-[#f7f8f5] text-[#14181c]">
      <DashboardHeader />

      <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-5xl items-center justify-center px-5 py-16 sm:px-8">
        <section className="w-full border border-[#dfe3dc] bg-white">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="border-b border-[#dfe3dc] px-6 py-10 sm:px-10 lg:border-b-0 lg:border-r lg:py-14">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center bg-[#14181c] text-[#b7f23a]">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#779f00]">
                    Fleex Premium
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#8a9092]">
                    A better way to create
                  </p>
                </div>
              </div>

              <div className="mt-12 max-w-xl">
                <div className="inline-flex items-center gap-2 border border-[#dfe3dc] bg-[#f7f8f5] px-3 py-2 text-xs font-bold text-[#557500]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Coming soon
                </div>
                <h1 className="mt-5 text-4xl font-black tracking-[-0.07em] sm:text-6xl">
                  More power for your next idea.
                </h1>
                <p className="mt-5 max-w-lg text-sm leading-7 text-[#687074] sm:text-base">
                  Fleex Premium is being carefully prepared for creators, teams,
                  and builders who want more room to grow. We are working on the
                  experience now.
                </p>
                <div className="mt-8 flex items-center gap-3 border-l-4 border-[#b7f23a] bg-[#f6faec] px-4 py-3 text-xs font-semibold text-[#557500]">
                  <Bell className="h-4 w-4 shrink-0" />
                  Premium access will be announced when it is ready.
                </div>
              </div>
            </div>

            <div className="bg-[#14181c] px-6 py-10 text-white sm:px-10 lg:py-14">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#b7f23a]">
                What we are building
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.05em]">
                A stronger creator workspace.
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/55">
                Premium will bring focused tools that help you build, publish,
                understand, and grow.
              </p>

              <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
                {plannedFeatures.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 py-4 text-sm font-semibold text-white/80"
                  >
                    <span className="flex h-5 w-5 items-center justify-center bg-[#b7f23a] text-[#14181c]">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {feature}
                  </div>
                ))}
              </div>

              <div className="mt-8 border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-bold text-white">
                  No action is required right now.
                </p>
                <p className="mt-1 text-xs leading-5 text-white/50">
                  Continue using Fleex normally. Your account and content will
                  be ready when Premium launches.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
