"use client";

import { Layers, Moon, Music, ShoppingBag, Store, University, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";

import { ApiClientError } from "@/lib/auth";
import { integrationApi } from "@/lib/integrations";
import "./integration.css";

function Step({
  icon,
  label,
  active,
  completed,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  completed?: boolean;
}) {
  return (
    <div className={`stepper-node ${active ? "active" : ""} ${completed ? "completed" : ""}`}>
      <div className="stepper-node-circle">{icon}</div>
      <p className="stepper-node-label">{label}</p>
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

  const expandedPlatform = hoveredPlatform || "shopify";

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
        <div className="collapsed-footer-content">
          <span className="text-xs font-semibold text-[#8ea4cb]">
            {isLoadingStatus
              ? "Checking status..."
              : shopifyState.connected
                ? "Connected"
                : "Not Connected"}
          </span>
          <button
            className={`btn-premium btn-collapsed-action ${!shopifyState.connected ? "active-connect" : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              if (!shopifyState.connected) {
                void handleConnectShopify();
              }
            }}
            type="button"
            disabled={isConnectingShopify || isLoadingStatus || shopifyState.connected}
          >
            {isConnectingShopify ? "..." : shopifyState.connected ? "Connected" : "Connect"}
          </button>
        </div>
      );
    }

    return (
      <div className="collapsed-footer-content">
        <span className="text-xs font-semibold text-[#8ea4cb]">Coming Soon</span>
        <button
          className="btn-premium btn-collapsed-action opacity-60 cursor-not-allowed"
          onClick={(event) => {
            event.stopPropagation();
            setOpenPlatform(platformId);
          }}
          type="button"
        >
          Soon
        </button>
      </div>
    );
  };

  const renderExpandedFooter = (platformId: string) => {
    if (platformId === "shopify") {
      if (!shopifyState.connected) {
        return (
          <button
            className="btn-premium btn-primary-teal w-full sm:w-auto"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void handleConnectShopify();
            }}
            disabled={isConnectingShopify || isLoadingStatus}
          >
            <Store className="h-4 w-4" />
            {isConnectingShopify ? "Connecting..." : "Connect Shopify"}
          </button>
        );
      }

      return (
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="btn-premium btn-primary-dark"
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
            className="btn-premium btn-primary-dark"
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
            className="btn-premium btn-secondary-outline text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
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
        className="btn-premium btn-secondary-outline opacity-60 cursor-not-allowed"
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
            className="absolute right-0 top-0 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#dbe2ee] bg-white text-[#91a2bd] shadow-sm transition-all duration-300 hover:scale-105 active:scale-95"
            type="button"
          >
            <Moon className="h-4 w-4" />
          </button>

          <div className="mx-auto max-w-3xl pt-16 text-center" data-tour="integration-intro">
            <h1 className="text-5xl font-semibold tracking-tight text-[#25344d]">Connect your sales channels</h1>
            <p className="mt-4 text-xl leading-relaxed text-[#8ea0bf]">
              Select the platforms you want to manage. We&apos;ll sync your inventory and orders automatically.
            </p>
          </div>

          {banner ? (
            <div className={`premium-alert-banner mx-auto mt-8 max-w-4xl ${banner.type}`}>
              <div className="flex-1 font-semibold">{banner.message}</div>
              <button
                type="button"
                className="text-current opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => setBanner(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <div className="mx-auto mt-12 max-w-3xl px-4">
            <div className="stepper-progress-bar">
              <div className="stepper-line" />
              <div className="stepper-line-active" style={{ width: "0%" }} />
              <Step active icon={<ShoppingBag className="h-4 w-4" />} label="Identity" />
              <Step icon={<University className="h-4 w-4" />} label="Banking" />
              <Step icon={<Store className="h-4 w-4" />} label="Marketplace" />
            </div>
          </div>

          <div className="mt-12 w-full">
            <div className="channel-deck">
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
                    className="channel-card"
                    data-platform={platform.id}
                    data-expanded={isExpanded}
                  >
                    <div className="deco-bubble" />

                    <div className="channel-card-inner">
                      <header className="channel-card-header">
                        <div className="icon-box">
                          {platform.icon}
                        </div>
                        {platform.badgeText ? (
                          <span
                            className={`badge-label ${
                              platform.id === "shopify"
                                ? "bg-[#e6fcf5] text-[#0d9488] border border-[#ccfbf1]"
                                : "bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]"
                            }`}
                          >
                            {platform.badgeText}
                          </span>
                        ) : null}
                      </header>

                      <main className="channel-card-body">
                        <h2 className="channel-card-title">{platform.title}</h2>

                        <div className="row-subtitle">
                          <div className="overflow-hidden">
                            <span className="subtitle-text">{platform.subtitle}</span>
                          </div>
                        </div>

                        <div className="row-description">
                          <div className="overflow-hidden">
                            <p className="description-text">{platform.description}</p>
                            {platform.id === "shopify" && shopifyState.connected && shopifyState.shopDomain ? (
                              <div className="mt-3">
                                <span className="connected-store">
                                  Connected store: {shopifyState.shopDomain}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </main>

                      <footer>
                        <div className="expanded-footer-wrapper">
                          <div className="expanded-footer-inner">
                            <div className="footer-divider" />
                            {renderExpandedFooter(platform.id)}
                          </div>
                        </div>

                        <div className="collapsed-footer-wrapper">
                          <div className="collapsed-footer-inner">
                            {renderCollapsedFooter(platform.id)}
                          </div>
                        </div>
                      </footer>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {openPlatform ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b162d]/55 p-4 backdrop-blur-xs">
          <article className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#2d3a5a] bg-[#131c35] text-white shadow-[0_30px_80px_-35px_rgba(17,31,56,0.9)] animate-in fade-in zoom-in-95 duration-200">
            <header className="flex items-center justify-between border-b border-[#243356] px-6 py-5">
              <div>
                <h3 className="text-2xl font-bold">{openPlatform}</h3>
                <p className="mt-1 text-sm text-[#8ea0c6]">This channel is planned for a future release. Shopify is the only active marketplace in the current MVP.</p>
              </div>
              <button 
                className="text-[#8ea0c6] hover:text-white transition-colors cursor-pointer" 
                onClick={() => setOpenPlatform(null)} 
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-xl bg-[#1d2744] border border-[#243356] px-5 py-4 text-sm text-[#cbd5e1] leading-relaxed">
                {openPlatform} integration is currently marked as <strong>Coming Soon</strong>. Please use Shopify for the MVP flow.
              </div>
            </div>

            <footer className="flex items-center justify-end gap-3 border-t border-[#243356] px-6 py-5">
              <button 
                className="btn-premium btn-secondary-outline text-white hover:text-white hover:bg-white/5 border-white/10" 
                onClick={() => setOpenPlatform(null)} 
                type="button"
              >
                Close
              </button>
            </footer>
          </article>
        </div>
      ) : null}
    </>
  );
}
