"use client";

import { Moon, ShoppingBag, Store, University, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

function ConnectCard({
  title,
  description,
  logo,
  onConnect,
}: {
  title: string;
  description: string;
  logo: string;
  onConnect: () => void;
}) {
  return (
    <article className="flex h-full flex-col rounded-3xl bg-[#1b2748] p-5 text-white shadow-[0_20px_45px_-34px_rgba(9,20,44,0.9)]">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#1b2748]">
        <span className="text-sm font-bold">{logo}</span>
      </div>
      <h3 className="text-4xl font-semibold leading-tight">{title}</h3>
      <p className="mt-2 text-xl leading-relaxed text-[#a8b8d6]">{description}</p>

      <div className="mt-auto pt-6">
        <div className="mb-3 h-px bg-[#4d5f87]" />
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#8ea4cb]">Not Connected</span>
          <button className="rounded-full bg-[#35d3ce] px-4 py-1 text-sm font-semibold text-white" onClick={onConnect} type="button">
            Connect
          </button>
        </div>
      </div>
    </article>
  );
}

function Step({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div className="relative z-10 flex w-1/3 flex-col items-center">
      <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full border ${active ? "border-[#3d7cff] bg-[#3d7cff] text-white" : "border-[#d4ddeb] bg-white text-[#8ea0bf]"}`}>
        {icon}
      </div>
      <p className={`text-sm font-semibold ${active ? "text-[#3d7cff]" : "text-[#8ea0bf]"}`}>{label}</p>
    </div>
  );
}

export default function IntegrationPage() {
  const [openPlatform, setOpenPlatform] = useState<string | null>(null);
  const router = useRouter();
  const [storeName, setStoreName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [autoSync, setAutoSync] = useState(true);

  return (
    <>
      <section className="px-4 py-5 md:px-8 md:py-8">
        <div className="relative mx-auto max-w-6xl">
          <button
            className="absolute right-0 top-0 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#dbe2ee] bg-white text-[#91a2bd] shadow-sm"
            type="button"
          >
            <Moon className="h-4 w-4" />
          </button>

          <div className="mx-auto max-w-3xl pt-16 text-center">
            <h1 className="text-5xl font-semibold tracking-tight text-[#25344d]">Connect your sales channels</h1>
            <p className="mt-4 text-2xl leading-relaxed text-[#8ea0bf]">
              Select the platforms you want to manage. We&apos;ll sync your inventory and orders automatically.
            </p>
          </div>

          <div className="relative mx-auto mt-10 flex max-w-3xl items-center justify-between">
            <div className="absolute left-0 right-0 top-5 h-px bg-[#dce4f1]" />
            <Step active icon={<ShoppingBag className="h-4 w-4" />} label="Identity" />
            <Step icon={<University className="h-4 w-4" />} label="Banking" />
            <Step icon={<Store className="h-4 w-4" />} label="Marketplace" />
          </div>

          <div className="mt-10 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.75fr)_minmax(0,0.75fr)]">
            <article className="relative overflow-hidden rounded-3xl border border-[#dbe2ee] bg-white p-5 shadow-[0_14px_30px_-24px_rgba(17,31,56,0.85)] md:p-6">
              <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#edf2fa]" />
              <div className="relative z-10">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f8a100] text-white">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-[#dff4e8] px-3 py-1 text-xs font-semibold text-[#37b87d]">• RECOMMENDED</span>
                </div>

                <h2 className="text-5xl font-semibold tracking-tight text-[#232f46]">Amazon Seller Central</h2>
                <p className="mt-3 max-w-xl text-xl leading-relaxed text-[#7f92b1]">
                  The world&apos;s largest marketplace. Import orders &amp; sync inventory FBA/FBM instantly with our deep integration.
                </p>

                <button
                  className="mt-5 inline-flex h-12 items-center gap-2 rounded-xl bg-[#233a69] px-5 text-sm font-semibold text-white"
                  onClick={() => setOpenPlatform("Amazon Seller Central")}
                  type="button"
                >
                  <Store className="h-4 w-4" />
                  Connect Amazon
                </button>
              </div>
            </article>

            <ConnectCard
              description="Sync your social commerce catalog and tap into viral trends."
              logo="♪"
              onConnect={() => setOpenPlatform("TikTok Shop")}
              title="TikTok Shop"
            />

            <ConnectCard
              description="Global auction and retail site integration for seamless listing."
              logo="e"
              onConnect={() => setOpenPlatform("eBay")}
              title="eBay"
            />
          </div>
        </div>
      </section>

      {openPlatform ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b162d]/55 p-4">
          <article className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#34466d] bg-[#1b2748] text-white shadow-[0_30px_80px_-35px_rgba(17,31,56,0.9)]">
            <header className="flex items-center justify-between border-b border-[#445982] px-5 py-4">
              <div>
                <h3 className="text-2xl font-semibold">Connect {openPlatform}</h3>
                <p className="mt-1 text-sm text-[#a8b8d6]">Authorize and sync your store catalog, orders, and payouts.</p>
              </div>
              <button className="text-[#a8b8d6]" onClick={() => setOpenPlatform(null)} type="button">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="space-y-4 px-5 py-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#b9c6df]">Store Name</label>
                <input
                  className="h-11 w-full rounded-xl border border-[#d6dce9] bg-white px-3 text-sm text-[#243251] outline-none"
                  onChange={(event) => setStoreName(event.target.value)}
                  placeholder="e.g. Main Brand Store"
                  type="text"
                  value={storeName}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#b9c6df]">Account ID</label>
                <input
                  className="h-11 w-full rounded-xl border border-[#d6dce9] bg-white px-3 text-sm text-[#243251] outline-none"
                  onChange={(event) => setAccountId(event.target.value)}
                  placeholder="Enter account identifier"
                  type="text"
                  value={accountId}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#b9c6df]">API Token</label>
                <input
                  className="h-11 w-full rounded-xl border border-[#d6dce9] bg-white px-3 text-sm text-[#243251] outline-none"
                  onChange={(event) => setApiToken(event.target.value)}
                  placeholder="Paste access token"
                  type="password"
                  value={apiToken}
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#243861] px-3 py-2">
                <p className="text-sm text-[#dce6ff]">Enable auto-sync for products and orders</p>
                <button
                  className={`relative h-6 w-12 rounded-full ${autoSync ? "bg-[#35d3ce]" : "bg-[#7d8fb5]"}`}
                  onClick={() => setAutoSync((prev) => !prev)}
                  type="button"
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white ${autoSync ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-[#445982] px-5 py-4">
              <button className="rounded-xl border border-[#8ea3c9] px-4 py-2 text-sm font-semibold text-white" onClick={() => setOpenPlatform(null)} type="button">
                Cancel
              </button>
              <button
                className="rounded-xl bg-[#35d3ce] px-4 py-2 text-sm font-semibold text-white"
                onClick={() => {
                  setOpenPlatform(null);
                  router.push("/integration/banking");
                }}
                type="button"
              >
                Connect
              </button>
            </footer>
          </article>
        </div>
      ) : null}
    </>
  );
}
