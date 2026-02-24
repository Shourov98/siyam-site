import DashboardHeroGraphic from "../components/DashboardHeroGraphic";

const walletCards = [
  {
    platform: "TIKTOK SHOP",
    amount: "$3,520.15",
    tag: "Synced",
    tone: "from-[#101d3f] via-[#1b2a53] to-[#223a79]",
  },
  {
    platform: "AMAZON",
    amount: "$6,830.22",
    tag: "Synced",
    tone: "from-[#1b2340] via-[#2a355e] to-[#4c3d4f]",
  },
  {
    platform: "EBAY",
    amount: "$2,100.43",
    tag: "Synced",
    tone: "from-[#1a2547] via-[#22335a] to-[#1e5a54]",
  },
];

const transactions = [
  { platform: "TikTok", order: "#ORD-2026-5432", description: "Sale - Blue-Shirt", amount: "+$25.99" },
  { platform: "eBay", order: "#ORD-2026-5432", description: "Sale - Blue-Shirt", amount: "+$25.99" },
  { platform: "TikTok", order: "#ORD-2026-5432", description: "Sale - Blue-Shirt", amount: "+$25.99" },
  { platform: "Amazon", order: "#ORD-2026-5435", description: "Sale - Headphones", amount: "+$59.00" },
];

export default function DashboardPage() {
  return (
    <section className="px-4 py-5 md:px-8 md:py-8">
      <div className="rounded-2xl border border-[#d5deec] bg-white p-4 shadow-[0_20px_50px_-40px_rgba(22,35,70,0.6)] md:p-6">
        <div className="overflow-hidden rounded-2xl border border-[#183054] bg-[#071228]">
          <DashboardHeroGraphic />
        </div>

        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[#1a2642]">$12,450.80</h1>
            <p className="mt-1 text-sm font-medium text-[#19c8d6]">Available for Withdrawal</p>
          </div>
          <button
            className="w-full rounded-xl bg-[#1f2b49] px-6 py-3 text-sm font-semibold tracking-wide text-white transition hover:bg-[#16203a] md:w-auto"
            type="button"
          >
            WITHDRAW ALL FUNDS
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {walletCards.map((card) => (
            <article
              className={`rounded-2xl bg-gradient-to-br p-4 text-white shadow-[0_20px_40px_-35px_rgba(14,28,65,0.9)] ${card.tone}`}
              key={card.platform}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#d5e6ff]">{card.platform}</span>
                <span className="rounded-full bg-[#0fbecc33] px-2 py-1 text-[10px] font-semibold text-[#6df1ff]">
                  {card.tag}
                </span>
              </div>
              <p className="mt-7 text-3xl font-bold tracking-tight">{card.amount}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-[#e1e6f0]">
          <table className="w-full text-left">
            <thead className="bg-[#f7f9fc]">
              <tr className="text-xs font-semibold uppercase tracking-wide text-[#8a98b5]">
                <th className="px-4 py-3 md:px-6">Platform</th>
                <th className="px-4 py-3 md:px-6">Order ID</th>
                <th className="px-4 py-3 md:px-6">Description</th>
                <th className="px-4 py-3 text-right md:px-6">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((row, index) => (
                <tr className="border-t border-[#edf1f7] text-sm text-[#44526d]" key={`${row.order}-${index}`}>
                  <td className="px-4 py-4 font-medium text-[#243251] md:px-6">{row.platform}</td>
                  <td className="px-4 py-4 font-semibold text-[#657391] md:px-6">{row.order}</td>
                  <td className="px-4 py-4 md:px-6">{row.description}</td>
                  <td className="px-4 py-4 text-right font-semibold text-[#243251] md:px-6">{row.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
