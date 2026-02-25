"use client";

import { useEffect, useMemo, useState } from "react";

type PlatformCard = {
  platform: string;
  status: string;
  tone: "amazon" | "tiktok" | "ebay";
  className: string;
};

type ChannelKey = "amazon" | "tiktok" | "ebay";

type ChannelMetric = {
  name: "Amazon" | "TikTok" | "eBay";
  mark: string;
  dot: string;
  row: string;
  startAmount: number;
  endAmount: number;
};

const ANIMATION_DURATION_MS = 4200;
const ORDER_ANIMATION_DELAYS: Record<ChannelKey, number> = {
  amazon: 0,
  tiktok: 1200,
  ebay: 2400,
};

const CHANNEL_METRICS: Record<ChannelKey, ChannelMetric> = {
  amazon: {
    name: "Amazon",
    mark: "a",
    dot: "#111827",
    row: "bg-cyan-200/25",
    startAmount: 4000,
    endAmount: 4200,
  },
  tiktok: {
    name: "TikTok",
    mark: "♪",
    dot: "#020617",
    row: "bg-cyan-100/14",
    startAmount: 3650,
    endAmount: 3800,
  },
  ebay: {
    name: "eBay",
    mark: "e",
    dot: "#ec4899",
    row: "bg-cyan-100/12",
    startAmount: 2000,
    endAmount: 2100,
  },
};

const platformCards: PlatformCard[] = [
  {
    platform: "Amazon",
    status: "Syncing...",
    tone: "amazon",
    className: "right-[8.8%] top-[10.2%] md:right-[12.2%] md:top-[10.7%]",
  },
  {
    platform: "TikTok Shop",
    status: "Live",
    tone: "tiktok",
    className: "bottom-[9.8%] left-[10.2%] md:bottom-[11.4%] md:left-[11.8%]",
  },
  {
    platform: "eBay",
    status: "Optimized",
    tone: "ebay",
    className: "bottom-[9.8%] right-[8.8%] md:bottom-[11.4%] md:right-[12.2%]",
  },
];

function LogoChip({ tone }: { tone: PlatformCard["tone"] }) {
  if (tone === "amazon") {
    return (
      <div className="grid h-[42px] w-[42px] place-items-center rounded-xl bg-[#f4f5f7] text-[38px] font-black leading-none text-[#212327]">
        a
      </div>
    );
  }

  if (tone === "tiktok") {
    return (
      <div className="grid h-[42px] w-[42px] place-items-center rounded-xl bg-black text-[24px] font-bold text-white">
        ♪
      </div>
    );
  }

  return (
    <div className="grid h-[42px] w-[42px] place-items-center rounded-xl bg-[#f4f5f7] text-base font-extrabold tracking-tight">
      <span>
        <span className="text-[#f44336]">e</span>
        <span className="text-[#1e88e5]">b</span>
        <span className="text-[#fbc02d]">a</span>
        <span className="text-[#43a047]">y</span>
      </span>
    </div>
  );
}

function PlatformCardItem({ platform, status, tone, className }: PlatformCard) {
  return (
    <article
      className={`absolute z-20 h-[86px] w-[250px] rounded-[16px] border border-cyan-100/16 bg-[linear-gradient(145deg,#172c42f2,#122235eb)] px-3 py-3 shadow-[0_24px_80px_-52px_#000000f2] backdrop-blur-sm md:h-[102px] md:w-[340px] ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <LogoChip tone={tone} />
        <div>
          <p className="text-[22px] font-semibold leading-none text-white/92 md:text-[16px]">
            {platform}
          </p>
          <p className="mt-1 text-[18px] leading-none text-[#22d3ee] md:text-[12px]">
            ● {status}
          </p>
        </div>
      </div>
      {tone === "tiktok" ? (
        <span className="absolute -bottom-5 right-4 z-30 -rotate-[2.5deg] rounded-lg bg-[#b9f56e] px-2.5 py-1 text-[13px] font-bold leading-none text-[#193205] shadow-[0_10px_24px_-16px_rgba(185,245,110,0.95)] md:-bottom-6 md:right-5 md:text-[12px]">
          Stock: 842
        </span>
      ) : null}
    </article>
  );
}

function formatCompactDollar(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 1,
    notation: "compact",
  })
    .format(amount)
    .replace("K", "k");
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function CenterOverview({
  amounts,
  total,
}: {
  amounts: Record<ChannelKey, number>;
  total: number;
}) {
  const rows = (Object.keys(CHANNEL_METRICS) as ChannelKey[]).map((key) => {
    const channel = CHANNEL_METRICS[key];
    return {
      name: channel.name,
      amount: formatCompactDollar(amounts[key]),
      mark: channel.mark,
      dot: channel.dot,
      row: channel.row,
    };
  });

  return (
    <section className="glowball-shadow-pulse absolute left-1/2 top-1/2 z-20 h-[290px] w-[290px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/75 bg-[radial-gradient(circle_at_40%_35%,rgba(170,255,246,1),rgba(97,234,225,0.95)_40%,rgba(45,206,214,0.9)_68%,rgba(28,175,190,0.86)_100%)] p-4 md:h-[350px] md:w-[350px] md:p-5">
      <div className="absolute inset-3 rounded-full border border-cyan-50/22 border-dashed" />
      <div className="relative h-full rounded-full border border-cyan-50/22 p-4 text-center md:p-5">
        <div className="flex items-center justify-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4f46e5]" />
          <p className="text-[10px] font-semibold text-[#01374b]">Overview</p>
          <span className="rounded-full bg-[#baf7bf] px-2 py-0.5 text-[9px] font-semibold text-[#0e7332]">
            Live
          </span>
        </div>
        <p className="mt-1.5 text-[8px] font-bold uppercase tracking-[0.1em] text-[#136071]">
          Total Sales
        </p>
        <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#136071]">
          Today
        </p>
        <p className="mt-1 text-[30px] font-black leading-none text-[#07253d] md:text-[34px]">
          {formatMoney(total)}
        </p>
        <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[#14758d]">
          +7.8% vs yesterday
        </p>

        <div className="mx-auto mt-3 flex w-full max-w-[150px] flex-col gap-1 md:max-w-[164px]">
          {rows.map((row) => (
            <div
              className={`flex items-center justify-between rounded-md border border-white/25 px-2 py-1 ${row.row}`}
              key={row.name}
            >
              <div className="flex items-center gap-2">
                <span
                  className="grid h-3.5 w-3.5 place-items-center rounded-full text-[9px] font-bold text-white"
                  style={{ backgroundColor: row.dot }}
                >
                  {row.mark}
                </span>
                <div>
                  <p className="text-[8px] font-semibold text-[#0b3450]">
                    {row.name}
                  </p>
                  <p className="text-[7px] text-[#1c657f]">Inventory</p>
                </div>
              </div>
              <p className="text-[8px] font-bold text-[#0c3751]">
                {row.amount}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function DashboardHeroGraphic() {
  const initialAmounts = useMemo(
    () =>
      (Object.keys(CHANNEL_METRICS) as ChannelKey[]).reduce(
        (acc, key) => {
          acc[key] = CHANNEL_METRICS[key].startAmount;
          return acc;
        },
        {} as Record<ChannelKey, number>,
      ),
    [],
  );

  const [amounts, setAmounts] =
    useState<Record<ChannelKey, number>>(initialAmounts);

  useEffect(() => {
    const timers = (Object.keys(CHANNEL_METRICS) as ChannelKey[]).map((key) =>
      window.setTimeout(() => {
        setAmounts((previous) => ({
          ...previous,
          [key]: CHANNEL_METRICS[key].endAmount,
        }));
      }, ORDER_ANIMATION_DELAYS[key] + ANIMATION_DURATION_MS),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const total = useMemo(
    () => Object.values(amounts).reduce((sum, value) => sum + value, 0),
    [amounts],
  );

  return (
    <div className="relative h-[440px] w-full overflow-hidden bg-[radial-gradient(ellipse_at_52%_52%,rgba(50,228,232,0.56)_0%,rgba(8,64,106,0.8)_45%,#040d2a_100%)] md:h-[660px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_52%,rgba(60,255,245,0.34)_0%,rgba(24,172,196,0.1)_41%,rgba(0,0,0,0)_72%)]" />
      <div className="glow-outside-pulse absolute left-1/2 top-1/2 h-[860px] w-[860px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/24 blur-[128px]" />

      <div className="absolute left-[56%] top-[38%] z-[5] h-px w-[20%] -rotate-[41deg] border-t border-dashed border-cyan-400/60" />
      <div className="absolute left-[23%] top-[63%] z-[5] h-px w-[20%] rotate-[139deg] border-t border-dashed border-cyan-400/60" />
      <div className="absolute left-[53%] top-[67%] z-[5] h-px w-[20%] rotate-[40deg] border-t border-dashed border-cyan-400/60" />

      <span className="absolute left-[36.7%] top-[30.7%] z-30 rounded-sm border border-lime-500/35 bg-[#020617]/65 px-1.5 py-0.5 text-[8px] font-semibold tracking-[0.06em] text-[#9bf68e]">
        API_OK
      </span>

      <PlatformCardItem {...platformCards[0]} />
      <PlatformCardItem {...platformCards[1]} />
      <PlatformCardItem {...platformCards[2]} />

      <span className="absolute right-[8.2%] top-[11.1%] z-30 rotate-[-6deg] rounded-lg bg-[#27d8ff] px-2.5 py-1 text-[13px] font-bold leading-none text-[#052038] shadow-[0_8px_26px_-16px_rgba(39,216,255,0.95)] md:right-[10.7%] md:top-[9.8%] md:text-[12px]">
        Orders: +12%
      </span>

      <span className="new-order-motion new-order-motion-amazon absolute left-[58.5%] top-[11.3%] z-30 rounded-full border border-[#2ab6ff] bg-[#071a38]/95 px-3 py-1 text-[12px] font-semibold leading-none text-[#19cbff] md:left-[58.6%] md:top-[11.1%] md:text-[11px]">
        New Order: #8430
      </span>

      <span className="new-order-motion new-order-motion-tiktok absolute left-[12.4%] top-[67.5%] z-30 rounded-full bg-[#22c7c2] px-3 py-1 text-[13px] font-semibold leading-none text-[#03253d] md:left-[12.9%] md:top-[67.2%] md:text-[12px]">
        New Order: #8432
      </span>

      <span className="new-order-motion new-order-motion-ebay absolute right-[25.2%] top-[70.7%] z-30 rounded-full border border-[#2d78ff] bg-[#081736]/95 px-3 py-1 text-[12px] font-semibold leading-none text-[#60b6ff] md:right-[26.2%] md:top-[70.3%] md:text-[11px]">
        New Order: #8431
      </span>

      <span className="absolute bottom-[20.8%] right-[8.4%] z-30 rounded-lg border border-cyan-400/45 bg-[#17313e]/88 px-2.5 py-1 text-[13px] font-bold leading-none text-white/95 md:bottom-[20.4%] md:right-[10.8%] md:text-[12px]">
        SKU-99 Updated
      </span>

      <CenterOverview amounts={amounts} total={total} />
    </div>
  );
}
