import AddProductEditor from "./AddProductEditor";

type MarketKey = "amazon" | "ebay" | "etsy" | "tiktok" | "shopify";

type AddProductPageProps = {
  searchParams: Promise<{ market?: string; productId?: string; id?: string }>;
};

const marketOrder: MarketKey[] = ["amazon", "ebay", "etsy", "tiktok", "shopify"];

export default async function AddProductPage({ searchParams }: AddProductPageProps) {
  const resolvedSearchParams = await searchParams;
  const market = resolvedSearchParams.market;
  const activeMarket: MarketKey = marketOrder.includes(market as MarketKey) ? (market as MarketKey) : "shopify";
  const initialProductId = resolvedSearchParams.productId ?? resolvedSearchParams.id ?? null;

  return <AddProductEditor activeMarket={activeMarket} initialProductId={initialProductId} />;
}
