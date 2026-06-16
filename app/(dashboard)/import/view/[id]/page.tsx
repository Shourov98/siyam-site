import ImportProductEditor from "../../[id]/ImportProductEditor";

type ImportViewPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ market?: string }>;
};

const marketOrder = ["amazon", "ebay", "etsy", "tiktok", "shopify"] as const;
type MarketKey = (typeof marketOrder)[number];

export default async function ImportViewPage({ params, searchParams }: ImportViewPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const market = resolvedSearchParams.market;
  const activeMarket: MarketKey = marketOrder.includes(market as MarketKey) ? (market as MarketKey) : "shopify";
  return <ImportProductEditor activeMarket={activeMarket} importId={id} readOnly />;
}
