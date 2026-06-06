"use client";

import { Layers, Moon, Music, ShoppingBag, Store, University, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";

import { ApiClientError } from "@/lib/auth";
import { integrationApi } from "@/lib/integrations";

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

type BannerState = {
  type: "success" | "error" | "info";
  message: string;
} | null;

type ShopifyState = {
  connected: boolean;
  shopDomain: string;
  status: "connected" | "disconnected" | "error" | "not_connected";
  source: "marketplace_connection" | "env_fallback" | "none";
};

const initialShopifyState: ShopifyState = {
  connected: false,
  shopDomain: "",
  status: "not_connected",
  source: "none",
};

export default function IntegrationPage() {
  const searchParams = useSearchParams();
  const [openPlatform, setOpenPlatform] = useState<string | null>(null);
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);
  const [banner, setBanner] = useState<BannerState>(null);
  const [shopifyState, setShopifyState] = useState<ShopifyState>(initialShopifyState);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isConnectingShopify, setIsConnectingShopify] = useState(false);
  const [isDisconnectingShopify, setIsDisconnectingShopify] = useState(false);
  const [isSyncingProducts, setIsSyncingProducts] = useState(false);
  const [isSyncingOrders, setIsSyncingOrders] = useState(false);

  const expandedPlatform = hoveredPlatform || "amazon";

  const loadShopifyStatus = async () => {
    setIsLoadingStatus(true);

    try {
      const status = await integrationApi.getShopifyStatus();
      setShopifyState({
        connected: status.connected,
        shopDomain: status.shop?.myshopifyDomain ?? status.connection?.shopDomain ?? "",
        status: status.connection?.status ?? (status.connected ? "connected" : "not_connected"),
        source: status.source,
      });
    } catch (error) {
      setBanner({
        type: "error",
        message: error instanceof ApiClientError ? error.message : "Failed to load Shopify status.",
      });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadShopifyStatus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const marketplace = searchParams.get("marketplace");
    const status = searchParams.get("status");
    const shop = searchParams.get("shop");
    const message = searchParams.get("message");

    if (marketplace !== "shopify" || !status) {
      return;
    }

    if (status === "connected") {
      startTransition(() => {
        setBanner({
          type: "success",
          message: shop ? `Shopify connected successfully: ${shop}` : "Shopify connected successfully.",
        });
      });

      const timer = window.setTimeout(() => {
        void loadShopifyStatus();
      }, 0);

      return () => window.clearTimeout(timer);
    }

    if (status === "error") {
      startTransition(() => {
        setBanner({
          type: "error",
          message: message ?? "Shopify connection failed.",
        });
      });
    }
  }, [searchParams]);

  const handleConnectShopify = async () => {
    setBanner(null);
    setIsConnectingShopify(true);

    try {
      const data = await integrationApi.getShopifyConnectUrl();
      window.location.href = data.connectUrl;
    } catch (error) {
      setBanner({
        type: "error",
        message: error instanceof ApiClientError ? error.message : "Failed to start Shopify connection.",
      });
      setIsConnectingShopify(false);
    }
  };

  const handleDisconnectShopify = async () => {
    setBanner(null);
    setIsDisconnectingShopify(true);

    try {
      await integrationApi.disconnectShopify();
      setBanner({
        type: "success",
        message: "Shopify disconnected successfully.",
      });
      await loadShopifyStatus();
    } catch (error) {
      setBanner({
        type: "error",
        message: error instanceof ApiClientError ? error.message : "Failed to disconnect Shopify.",
      });
    } finally {
      setIsDisconnectingShopify(false);
    }
  };

  const handleSyncProducts = async () => {
    setBanner(null);
    setIsSyncingProducts(true);

    try {
      await integrationApi.importShopifyProducts();
      setBanner({
        type: "success",
        message: "Shopify products imported successfully",
      });
      await loadShopifyStatus();
    } catch (error) {
      setBanner({
        type: "error",
        message: error instanceof ApiClientError ? error.message : "Failed to import Shopify products.",
      });
    } finally {
      setIsSyncingProducts(false);
    }
  };

  const handleSyncOrders = async () => {
    setBanner(null);
    setIsSyncingOrders(true);

    try {
      await integrationApi.importShopifyOrders();
      setBanner({
        type: "success",
        message: "Shopify orders imported successfully",
      });
      await loadShopifyStatus();
    } catch (error) {
      setBanner({
        type: "error",
        message: error instanceof ApiClientError ? error.message : "Failed to import Shopify orders.",
      });
    } finally {
      setIsSyncingOrders(false);
    }
  };

  const platforms = useMemo(
    () => [
      {
        id: "amazon",
        title: "Amazon",
        subtitle: "Seller Central",
        description: "The world's largest marketplace. Amazon remains disabled for this MVP release.",
        icon: <ShoppingBag className="h-5 w-5" />,
        themeBg: "bg-[#f8a100]",
        badgeText: "COMING SOON",
        interactive: false,
      },
      {
        id: "tiktok",
        title: "TikTok Shop",
        subtitle: "Social Commerce",
        description: "TikTok Shop remains disabled for this MVP release.",
        icon: <Music className="h-5 w-5" />,
        themeBg: "bg-[#ff0050]",
        badgeText: "COMING SOON",
        interactive: false,
      },
      {
        id: "ebay",
        title: "eBay",
        subtitle: "Global Retail",
        description: "eBay remains disabled for this MVP release.",
        icon: <Layers className="h-5 w-5" />,
        themeBg: "bg-[#0064d2]",
        badgeText: "COMING SOON",
        interactive: false,
      },
      {
        id: "shopify",
        title: "Shopify",
        subtitle: "Web Storefront",
        description: "Sync products, customers, and orders seamlessly with your custom Shopify storefront using our API.",
        icon: <Store className="h-5 w-5" />,
        themeBg: "bg-[#95bf47]",
        badgeText: shopifyState.connected ? "CONNECTED" : null,
        interactive: true,
      },
    ],
    [shopifyState.connected]
  );

  const renderCollapsedFooter = (platformId: string) => {
    if (platformId === "shopify") {
      return (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#8ea4cb]">
            {isLoadingStatus
              ? "Checking status..."
              : shopifyState.connected
                ? `Connected${shopifyState.shopDomain ? ` • ${shopifyState.shopDomain}` : ""}`
                : "Not Connected"}
          </span>
          <button
            className="rounded-full bg-[#35d3ce] px-4 py-1 text-sm font-semibold text-white hover:bg-[#2bc4c0] transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-80"
            onClick={(event) => {
              event.stopPropagation();
              if (!shopifyState.connected) {
                void handleConnectShopify();
              }
            }}
            type="button"
            disabled={isConnectingShopify || isLoadingStatus || shopifyState.connected}
          >
            {isConnectingShopify ? "Connecting..." : shopifyState.connected ? "Connected" : "Connect Shopify"}
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#8ea4cb]">Coming Soon</span>
        <button
          className="rounded-full bg-[#5c6c92] px-4 py-1 text-sm font-semibold text-white cursor-not-allowed opacity-85"
          onClick={(event) => {
            event.stopPropagation();
            setOpenPlatform(platformId);
          }}
          type="button"
        >
          Coming Soon
        </button>
      </div>
    );
  };

  const renderExpandedFooter = (platformId: string) => {
    if (platformId === "shopify") {
      if (!shopifyState.connected) {
        return (
          <button
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#233a69] px-5 text-sm font-semibold text-white hover:bg-[#1a2c52] transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-80"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void handleConnectShopify();
            }}
            disabled={isConnectingShopify || isLoadingStatus}
          >
            <Store className="h-4 w-4" />
            {isConnectingShopify ? "Generating Connect URL..." : "Connect Shopify"}
          </button>
        );
      }

      return (
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#233a69] px-5 text-sm font-semibold text-white hover:bg-[#1a2c52] transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-80"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void handleSyncProducts();
            }}
            disabled={isSyncingProducts}
          >
            {isSyncingProducts ? "Syncing Products..." : "Sync Products"}
          </button>
          <button
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#233a69] px-5 text-sm font-semibold text-white hover:bg-[#1a2c52] transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-80"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void handleSyncOrders();
            }}
            disabled={isSyncingOrders}
          >
            {isSyncingOrders ? "Syncing Orders..." : "Sync Orders"}
          </button>
          <button
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-[#8ea3c9] px-5 text-sm font-semibold text-[#233a69] hover:bg-[#e7eefb] transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-80"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void handleDisconnectShopify();
            }}
            disabled={isDisconnectingShopify}
          >
            {isDisconnectingShopify ? "Disconnecting..." : "Disconnect"}
          </button>
        </div>
      );
    }

    return (
      <button
        className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#5c6c92] px-5 text-sm font-semibold text-white cursor-not-allowed opacity-85"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpenPlatform(platformId);
        }}
      >
        Coming Soon
      </button>
    );
  };

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

          <div className="mx-auto max-w-3xl pt-16 text-center" data-tour="integration-intro">
            <h1 className="text-5xl font-semibold tracking-tight text-[#25344d]">Connect your sales channels</h1>
            <p className="mt-4 text-2xl leading-relaxed text-[#8ea0bf]">
              Select the platforms you want to manage. We&apos;ll sync your inventory and orders automatically.
            </p>
          </div>

          {banner ? (
            <div
              className={`mx-auto mt-8 max-w-4xl rounded-2xl border px-4 py-3 text-sm font-medium ${
                banner.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : banner.type === "error"
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {banner.message}
            </div>
          ) : null}

          <div className="relative mx-auto mt-10 flex max-w-3xl items-center justify-between">
            <div className="absolute left-0 right-0 top-5 h-px bg-[#dce4f1]" />
            <Step active icon={<ShoppingBag className="h-4 w-4" />} label="Identity" />
            <Step icon={<University className="h-4 w-4" />} label="Banking" />
            <Step icon={<Store className="h-4 w-4" />} label="Marketplace" />
          </div>

          <div className="mt-10 flex min-h-[400px] w-full flex-col items-stretch gap-5 xl:flex-row">
            {platforms.map((platform) => {
              const isExpanded = expandedPlatform === platform.id;

              return (
                <article
                  key={platform.id}
                  onMouseEnter={() => setHoveredPlatform(platform.id)}
                  onMouseLeave={() => setHoveredPlatform(null)}
                  onClick={() => {
                    if (!platform.interactive) {
                      setOpenPlatform(platform.title);
                    }
                  }}
                  className={`relative overflow-hidden rounded-3xl p-5 md:p-6 flex flex-col justify-between ${
                    platform.interactive ? "cursor-default" : "cursor-pointer"
                  } ${
                    isExpanded
                      ? "bg-white border border-[#dbe2ee] shadow-[0_20px_50px_-30px_rgba(22,35,70,0.3)]"
                      : "bg-[#1b2748] border border-transparent shadow-[0_20px_45px_-34px_rgba(9,20,44,0.9)]"
                  }`}
                  style={{
                    flex: isExpanded ? "2.3 1 0%" : "1 1 0%",
                    minWidth: 0,
                    transition: "flex 600ms cubic-bezier(0.4, 0, 0.2, 1), background-color 400ms ease, border-color 400ms ease, box-shadow 500ms ease",
                    willChange: "flex",
                  }}
                >
                  <div
                    className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#edf2fa]"
                    style={{
                      opacity: isExpanded ? 1 : 0,
                      transform: isExpanded ? "scale(1)" : "scale(0)",
                      transition: "opacity 600ms ease, transform 700ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />

                  <div className="relative z-10 flex flex-1 flex-col justify-between">
                    <div className="mb-4 flex w-full items-start justify-between">
                      <div
                        className={`relative h-11 w-11 shrink-0 rounded-xl font-bold ${
                          isExpanded ? platform.themeBg : "bg-white"
                        }`}
                        style={{
                          transition: "background-color 400ms ease",
                        }}
                      >
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{
                            color: isExpanded ? "#ffffff" : "#1b2748",
                            transition: "color 400ms ease",
                          }}
                        >
                          {platform.icon}
                        </div>
                      </div>

                      {platform.badgeText ? (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            platform.id === "shopify"
                              ? "bg-[#dff4e8] text-[#37b87d]"
                              : "bg-[#eef1f5] text-[#60708d]"
                          }`}
                          style={{
                            opacity: isExpanded ? 1 : 0,
                            transform: isExpanded ? "translateY(0)" : "translateY(-8px)",
                            transition: "opacity 400ms ease, transform 400ms ease",
                            pointerEvents: isExpanded ? "auto" : "none",
                          }}
                        >
                          {platform.badgeText}
                        </span>
                      ) : null}
                    </div>

                    <div className="relative flex flex-1 flex-col justify-center select-none">
                      <div
                        style={{
                          opacity: isExpanded ? 1 : 0,
                          transition: "opacity 350ms ease",
                          pointerEvents: isExpanded ? "auto" : "none",
                        }}
                      >
                        <h2 className="whitespace-nowrap text-3xl font-semibold leading-none tracking-tight text-[#232f46] md:text-4xl">
                          {platform.title}
                        </h2>
                      </div>

                      <div
                        className="absolute left-0 top-0"
                        style={{
                          opacity: isExpanded ? 0 : 1,
                          transition: "opacity 350ms ease",
                          pointerEvents: isExpanded ? "none" : "auto",
                        }}
                      >
                        <h2 className="whitespace-nowrap text-xl font-semibold leading-none tracking-tight text-white">
                          {platform.title}
                        </h2>
                      </div>

                      <div
                        className="overflow-hidden"
                        style={{
                          display: "grid",
                          gridTemplateRows: isExpanded ? "1fr" : "0fr",
                          opacity: isExpanded ? 1 : 0,
                          transition: "grid-template-rows 500ms cubic-bezier(0.4, 0, 0.2, 1), opacity 400ms ease",
                          marginTop: isExpanded ? "6px" : "0px",
                        }}
                      >
                        <div className="overflow-hidden">
                          <span className="block whitespace-nowrap text-base font-medium text-[#7f92b1] md:text-lg">
                            {platform.subtitle}
                          </span>
                        </div>
                      </div>

                      <div
                        className="overflow-hidden"
                        style={{
                          display: "grid",
                          gridTemplateRows: isExpanded ? "1fr" : "0fr",
                          opacity: isExpanded ? 1 : 0,
                          transition: "grid-template-rows 500ms cubic-bezier(0.4, 0, 0.2, 1), opacity 400ms ease 100ms",
                          marginTop: isExpanded ? "12px" : "0px",
                        }}
                      >
                        <div className="overflow-hidden">
                          <p className="text-sm leading-relaxed text-[#7f92b1] md:text-base xl:max-w-[320px]">
                            {platform.description}
                          </p>
                          {platform.id === "shopify" && shopifyState.connected && shopifyState.shopDomain ? (
                            <p className="mt-3 text-sm font-semibold text-[#355a84]">Connected store: {shopifyState.shopDomain}</p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto w-full">
                      <div
                        className="overflow-hidden"
                        style={{
                          display: "grid",
                          gridTemplateRows: isExpanded ? "1fr" : "0fr",
                          opacity: isExpanded ? 1 : 0,
                          transition: "grid-template-rows 500ms cubic-bezier(0.4, 0, 0.2, 1), opacity 400ms ease",
                          paddingTop: isExpanded ? "20px" : "0px",
                        }}
                      >
                        <div className="overflow-hidden">{renderExpandedFooter(platform.id)}</div>
                      </div>

                      <div
                        className="overflow-hidden"
                        style={{
                          display: "grid",
                          gridTemplateRows: !isExpanded ? "1fr" : "0fr",
                          opacity: !isExpanded ? 1 : 0,
                          transition: "grid-template-rows 500ms cubic-bezier(0.4, 0, 0.2, 1), opacity 400ms ease",
                          paddingTop: !isExpanded ? "20px" : "0px",
                        }}
                      >
                        <div className="overflow-hidden">
                          <div className="mb-3 h-px bg-[#4d5f87]/50" />
                          {renderCollapsedFooter(platform.id)}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {openPlatform ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b162d]/55 p-4">
          <article className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#34466d] bg-[#1b2748] text-white shadow-[0_30px_80px_-35px_rgba(17,31,56,0.9)]">
            <header className="flex items-center justify-between border-b border-[#445982] px-5 py-4">
              <div>
                <h3 className="text-2xl font-semibold">{openPlatform}</h3>
                <p className="mt-1 text-sm text-[#a8b8d6]">This channel is planned for a future release. Shopify is the only active marketplace in the current MVP.</p>
              </div>
              <button className="text-[#a8b8d6]" onClick={() => setOpenPlatform(null)} type="button">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="space-y-4 px-5 py-4">
              <div className="rounded-xl bg-[#243861] px-4 py-4 text-sm text-[#dce6ff]">
                {openPlatform} integration is currently marked as Coming Soon. Please use Shopify for the MVP flow.
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-[#445982] px-5 py-4">
              <button className="rounded-xl border border-[#8ea3c9] px-4 py-2 text-sm font-semibold text-white" onClick={() => setOpenPlatform(null)} type="button">
                Close
              </button>
            </footer>
          </article>
        </div>
      ) : null}
    </>
  );
}
