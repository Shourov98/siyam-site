import { CalendarDays, Edit3, EyeOff, Filter, Search, Trash2, Wallet } from "lucide-react";

function StatusBadge({ status }: { status: "Completed" | "Pending" }) {
  if (status === "Pending") {
    return <span className="rounded-full bg-[#fff2d6] px-3 py-1 text-xs font-semibold text-[#f4a632]">Pending</span>;
  }

  return <span className="rounded-full bg-[#ddf7f0] px-3 py-1 text-xs font-semibold text-[#56cbc2]">Completed</span>;
}

export default function WalletPlatformDetailsPage() {
  return (
    <section className="px-4 py-5 md:px-8 md:py-8">
      <div className="space-y-4">
        <header className="rounded-xl border border-[#2c3b61] bg-[#1b2748] px-5 py-5 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Global Wallet - Platform Details</h1>
              <p className="mt-1 text-sm text-[#a9b8d6]">
                Platform ID: AMZ-8829-X <span className="ml-1 rounded-full border border-[#1ed9d2] px-2 py-0.5 text-xs text-[#1ed9d2]">Connected</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d6ddea] bg-[#f7f9fd] px-5 text-sm font-semibold text-[#4f607c]" type="button">
                <CalendarDays className="h-4 w-4" />
                View Analytics
              </button>
              <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#35d3ce] px-5 text-sm font-semibold text-white" type="button">
                <Wallet className="h-4 w-4" />
                Request Payout
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.8fr)_minmax(260px,1fr)]">
          <article className="rounded-2xl bg-gradient-to-r from-[#1a2748] via-[#1d2d56] to-[#1f356a] p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8ea4cb]">Total Balance</p>
            <p className="mt-2 text-6xl font-bold tracking-tight">$14,230.50</p>
            <div className="mt-4 grid gap-3 border-t border-[#2e5b81] pt-3 sm:grid-cols-2">
              <div>
                <p className="text-sm text-[#8ea4cb]">Available for Payout</p>
                <p className="mt-1 text-4xl font-semibold">$8,450.00 <span className="rounded-full bg-[#0f5138] px-2 py-0.5 text-xs text-[#5af7ac]">+12%</span></p>
              </div>
              <div>
                <p className="text-sm text-[#8ea4cb]">Pending Clearance</p>
                <p className="mt-1 text-4xl font-semibold">$5,780.50</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl bg-[#1a2748] p-5 text-white">
            <p className="text-sm text-[#a9b8d6]">Next Scheduled Payout</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="rounded-xl bg-[#f3f6fb] px-3 py-2 text-center text-[#2b3d5f]">
                <p className="text-xs font-semibold">OCT</p>
                <p className="text-3xl font-bold">28</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">Automatic Transfer</p>
                <p className="text-sm text-[#9fb1d0]">To Chase Bank ••••8829</p>
              </div>
            </div>
            <button className="mt-5 w-full rounded-xl bg-[#35d3ce] py-2.5 text-sm font-semibold text-white" type="button">
              Manage Settings
            </button>
          </article>
        </div>

        <article className="rounded-2xl border border-[#dbe2ee] bg-white shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
          <div className="flex flex-col gap-3 border-b border-[#e5ebf5] px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
            <h2 className="text-2xl font-semibold text-[#1f2c44]">Recent Transactions</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#96a3bc]" />
                <input
                  className="h-10 w-64 rounded-xl border border-[#d6dce9] bg-white py-2 pl-10 pr-3 text-sm text-[#243251] outline-none placeholder:text-[#8f9bb1]"
                  placeholder="Search transactions..."
                  type="text"
                />
              </div>
              <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d5dcea] bg-white px-4 text-sm font-semibold text-[#465574]" type="button">
                <CalendarDays className="h-4 w-4" />
                Last 30 Days
              </button>
              <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d5dcea] bg-white px-4 text-sm font-semibold text-[#465574]" type="button">
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="bg-[#233a69] text-xs font-semibold uppercase tracking-wide text-[#d8e4fb]">
                <tr>
                  <th className="w-12 px-4 py-4">○</th>
                  <th className="px-4 py-4">Description</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Type</th>
                  <th className="px-4 py-4">Amount</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { status: "Completed" as const },
                  { status: "Pending" as const },
                  { status: "Completed" as const },
                  { status: "Completed" as const },
                  { status: "Completed" as const },
                ].map((row, index) => (
                  <tr className="border-t border-[#e9eef7] text-sm text-[#44526d]" key={index}>
                    <td className="px-4 py-4">
                      <span className="inline-block h-3.5 w-3.5 rounded-full border border-[#95a3bd]" />
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[#2c3a57]">Order #TRX-8892</p>
                      <p className="text-xs text-[#8ea0bf]">Wireless Headphones</p>
                    </td>
                    <td className="px-4 py-4 text-[#7e8fae]">Oct 24, 2023<br />10:42 AM</td>
                    <td className="px-4 py-4">Product Sale</td>
                    <td className="px-4 py-4 font-semibold text-[#4a5b78]">+$25.99</td>
                    <td className="px-4 py-4"><StatusBadge status={row.status} /></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button className="text-[#223763]" type="button"><Edit3 className="h-4 w-4" /></button>
                        <button className="text-[#f03f8f]" type="button"><Trash2 className="h-4 w-4" /></button>
                        <button className="text-[#1c2438]" type="button"><EyeOff className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[#e5ebf5] px-5 py-3 text-sm text-[#6f809f]">
            <p>Showing 1 to 4 of 128 results</p>
            <div className="flex items-center gap-2">
              <button className="rounded-xl border border-[#c7d3e6] px-4 py-1.5 font-semibold text-[#60708d]" type="button">Previous</button>
              <button className="rounded-xl border border-[#c7d3e6] px-4 py-1.5 font-semibold text-[#60708d]" type="button">Next</button>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
