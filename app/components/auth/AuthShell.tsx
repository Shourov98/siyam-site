"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
};

function ConnectApplicationsSlide() {
  return (
    <>
      <div className="relative w-full max-w-[760px]">
        <div className="relative mx-auto h-[460px] w-full">
          <Image src="/Margin.svg" alt="Connected marketplaces illustration" fill className="object-contain" />
        </div>
      </div>

      <h2 className="mt-8 text-center text-2xl font-semibold leading-tight text-white xl:text-3xl">
        Connect with every application.
      </h2>
      <p className="mt-3 max-w-[560px] text-center text-sm leading-[1.5] text-[#c1cde5] xl:text-base">
        Everything you need in an easily customizable dashboard
        <br />
        for complete e-commerce orchestration.
      </p>
    </>
  );
}

function RealTimeSyncSlide() {
  return (
    <>
      <div className="w-full max-w-[560px] rounded-3xl border border-[#425986] bg-[#2a3f69] p-6 shadow-[0_18px_36px_rgba(20,36,69,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#afbdd9]">
          Global Sales Today
        </p>
        <p className="mt-1 text-[13px] font-semibold text-white">AMAZON</p>
        <p className="text-[13px] font-semibold text-white">LISTING</p>

        <div className="mt-8 inline-flex rounded-full bg-[#2e5a7a] px-3 py-1.5 text-[14px] font-semibold text-[#59d6a3]">
          ↗ +12.5% <span className="ml-1 text-[#61ddaa]">vs yesterday</span>
        </div>

        <div className="my-8 h-px bg-[#48618f]" />

        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-[#39517e] px-3 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#1f2940]">
              □
            </span>
            <div className="flex-1">
              <p className="text-base font-semibold text-[#d8e2f5] xl:text-lg">New Sale: Amazon</p>
              <p className="text-sm text-[#9baacf] xl:text-[15px]">Order #AMZ-8821</p>
            </div>
            <p className="text-[12px] text-[#8d9cbf]">MPN</p>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-[#39517e] px-3 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0f1115] text-white">
              ♪
            </span>
            <div className="flex-1">
              <p className="text-base font-semibold text-[#d8e2f5] xl:text-lg">
                Inventory Updated: TikTok
              </p>
              <p className="text-sm text-[#9baacf] xl:text-[15px]">SKU-992 Re-synced</p>
            </div>
            <p className="text-[12px] text-[#8d9cbf]">1s ago</p>
          </div>
        </div>
      </div>

      <h2 className="mt-12 text-center text-2xl font-semibold leading-tight text-white xl:text-3xl">
        Real-Time Synchronization
      </h2>
      <p className="mt-3 max-w-[560px] text-center text-sm leading-[1.5] text-[#c1cde5] xl:text-base">
        Watch your empire grow live. The Master Count ledger
        <br />
        updates instantly across every channel.
      </p>
    </>
  );
}

const slides = [<ConnectApplicationsSlide key="connect" />, <RealTimeSyncSlide key="sync" />];

export default function AuthShell({ children }: AuthShellProps) {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen w-full bg-[#f3f4f6]">
      <div className="flex min-h-screen w-full">
        <section className="w-full bg-[#f3f4f6] px-7 py-8 sm:px-10 lg:w-1/2 lg:px-16 lg:py-12">
          {children}
        </section>

        <section className="relative hidden w-1/2 overflow-hidden bg-[radial-gradient(circle_at_52%_60%,rgba(76,109,178,0.5)_0%,rgba(34,52,99,0.9)_48%,#16264a_100%)] lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0)_45%)]" />
          <div
            className="pointer-events-none absolute right-[16%] top-[16%] h-24 w-24 rounded-full blur-2xl"
            style={{ backgroundColor: "#1d8ca2", opacity: 0.18 }}
          />

          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-700 ${
                index === activeSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="relative flex h-full flex-col items-center justify-center px-14 py-16">
                {slide}
              </div>
            </div>
          ))}

          <div className="absolute bottom-20 left-1/2 flex -translate-x-1/2 items-center gap-3">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveSlide(index)}
                className={`h-3 w-3 rounded-full transition ${
                  index === activeSlide ? "bg-white" : "bg-white/60"
                }`}
                aria-label={`View slide ${index + 1}`}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
