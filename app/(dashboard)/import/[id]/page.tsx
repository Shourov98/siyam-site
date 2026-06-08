import ImportProductEditor from "./ImportProductEditor";

type MarketKey = "amazon" | "ebay" | "etsy" | "tiktok" | "shopify";

type ImportEditPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ market?: string }>;
};

const marketOrder: MarketKey[] = ["amazon", "ebay", "etsy", "tiktok", "shopify"];

export default async function ImportEditPage({ params, searchParams }: ImportEditPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const market = resolvedSearchParams.market;
  const activeMarket: MarketKey = marketOrder.includes(market as MarketKey) ? (market as MarketKey) : "shopify";
  return <ImportProductEditor activeMarket={activeMarket} importId={id} />;
}
