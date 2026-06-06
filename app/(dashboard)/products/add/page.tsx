import AddProductEditor from "./AddProductEditor";

type MarketKey = "amazon" | "ebay" | "tiktok" | "shopify";

type AddProductPageProps = {
  searchParams: Promise<{ market?: string }>;
};

const marketOrder: MarketKey[] = ["amazon", "ebay", "tiktok", "shopify"];

export default async function AddProductPage({ searchParams }: AddProductPageProps) {
  const resolvedSearchParams = await searchParams;
  const market = resolvedSearchParams.market;
  const activeMarket: MarketKey = marketOrder.includes(market as MarketKey) ? (market as MarketKey) : "shopify";

  return <AddProductEditor activeMarket={activeMarket} />;
}
