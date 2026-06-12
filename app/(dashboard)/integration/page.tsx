"use client";

import { Gift, Layers, Moon, Music, ShoppingBag, Store, University, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";

import { ApiClientError } from "@/lib/auth";
import { integrationApi } from "@/lib/integrations";
import {
  initialEbayState,
  initialEtsyState,
  initialShopifyState,
  useIntegrationPageStore,
  type BannerState,
} from "@/lib/stores/integration-page-store";
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

export default function IntegrationPage() {
  const searchParams = useSearchParams();
  const [openPlatform, setOpenPlatform] = useState<string | null>(null);
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);
  const banner = useIntegrationPageStore((state) => state.banner);
  const shopifyState = useIntegrationPageStore((state) => state.shopifyState);
  const ebayState = useIntegrationPageStore((state) => state.ebayState);
  const etsyState = useIntegrationPageStore((state) => state.etsyState);
  const isLoadingStatus = useIntegrationPageStore((state) => state.isLoadingStatus);
  const isConnectingShopify = useIntegrationPageStore((state) => state.isConnectingShopify);
  const isConnectingEbay = useIntegrationPageStore((state) => state.isConnectingEbay);
  const isConnectingEtsy = useIntegrationPageStore((state) => state.isConnectingEtsy);
  const isDisconnectingShopify = useIntegrationPageStore((state) => state.isDisconnectingShopify);
  const isDisconnectingEbay = useIntegrationPageStore((state) => state.isDisconnectingEbay);
  const isDisconnectingEtsy = useIntegrationPageStore((state) => state.isDisconnectingEtsy);
  const isSyncingProducts = useIntegrationPageStore((state) => state.isSyncingProducts);
  const isSyncingOrders = useIntegrationPageStore((state) => state.isSyncingOrders);
  const hasLoadedOnce = useIntegrationPageStore((state) => state.hasLoadedOnce);
  const shouldRefresh = useIntegrationPageStore((state) => state.shouldRefresh);
  const setBanner = useIntegrationPageStore((state) => state.setBanner);
  const setConnectingShopify = useIntegrationPageStore((state) => state.setConnectingShopify);
  const setConnectingEbay = useIntegrationPageStore((state) => state.setConnectingEbay);
  const setConnectingEtsy = useIntegrationPageStore((state) => state.setConnectingEtsy);
  const loadShopifyStatus = useIntegrationPageStore((state) => state.loadShopifyStatus);
  const loadEbayStatus = useIntegrationPageStore((state) => state.loadEbayStatus);
  const loadEtsyStatus = useIntegrationPageStore((state) => state.loadEtsyStatus);
  const disconnectShopify = useIntegrationPageStore((state) => state.disconnectShopify);
  const disconnectEbay = useIntegrationPageStore((state) => state.disconnectEbay);
  const disconnectEtsy = useIntegrationPageStore((state) => state.disconnectEtsy);
  const syncProducts = useIntegrationPageStore((state) => state.syncProducts);
  const syncOrders = useIntegrationPageStore((state) => state.syncOrders);

  const expandedPlatform = hoveredPlatform || "ebay";

  useEffect(() => {
    const isInitialState =
      shopifyState.connected === initialShopifyState.connected &&
      shopifyState.shopDomain === initialShopifyState.shopDomain &&
      shopifyState.status === initialShopifyState.status &&
      shopifyState.source === initialShopifyState.source &&
      ebayState.connected === initialEbayState.connected &&
      ebayState.displayName === initialEbayState.displayName &&
      ebayState.status === initialEbayState.status &&
      ebayState.environment === initialEbayState.environment &&
      etsyState.connected === initialEtsyState.connected &&
      etsyState.displayName === initialEtsyState.displayName &&
      etsyState.status === initialEtsyState.status &&
      etsyState.environment === initialEtsyState.environment;

    if (!hasLoadedOnce || isInitialState) {
      void loadShopifyStatus();
      void loadEbayStatus();
      void loadEtsyStatus();
      return;
    }

    if (shouldRefresh()) {
      void loadShopifyStatus();
      void loadEbayStatus();
      void loadEtsyStatus();
    }
  }, [ebayState, etsyState, hasLoadedOnce, loadEbayStatus, loadEtsyStatus, loadShopifyStatus, shopifyState, shouldRefresh]);

  useEffect(() => {
    const marketplace = searchParams.get("marketplace");
    const status = searchParams.get("status");
    const message = searchParams.get("message");

    if (!marketplace || !status) {
      return;
    }

    if (status === "connected") {
      startTransition(() => {
        setBanner({
          type: "success",
          message:
            marketplace === "ebay"
              ? "eBay connected successfully."
              : marketplace === "etsy"
                ? "Etsy connected successfully."
                : "Shopify connected successfully.",
        });
      });

      const timer = window.setTimeout(() => {
        if (marketplace === "ebay") {
          void loadEbayStatus();
        } else if (marketplace === "etsy") {
          void loadEtsyStatus();
        } else {
          void loadShopifyStatus();
        }
      }, 0);

      return () => window.clearTimeout(timer);
    }

    if (status === "error") {
      startTransition(() => {
        setBanner({
          type: "error",
          message: message ?? (marketplace === "ebay" ? "eBay connection failed." : marketplace === "etsy" ? "Etsy connection failed." : "Shopify connection failed."),
        });
      });
      if (marketplace === "ebay") {
        setConnectingEbay(false);
      } else if (marketplace === "etsy") {
        setConnectingEtsy(false);
      } else {
        setConnectingShopify(false);
      }
    }
  }, [loadEbayStatus, loadEtsyStatus, loadShopifyStatus, searchParams, setBanner, setConnectingEbay, setConnectingEtsy, setConnectingShopify]);

  const handleConnectShopify = async () => {
    setBanner(null);
    setConnectingShopify(true);

    try {
      const data = await integrationApi.getShopifyConnectUrl();
      window.location.href = data.connectUrl;
    } catch (error) {
      setBanner({
        type: "error",
        message: error instanceof ApiClientError ? error.message : "Failed to start Shopify connection.",
      } satisfies NonNullable<BannerState>);
      setConnectingShopify(false);
    }
  };

  const handleConnectEbay = async () => {
    setBanner(null);
    setConnectingEbay(true);

    try {
      const data = await integrationApi.getEbayConnectUrl();
      window.location.href = data.connectUrl;
    } catch (error) {
      setBanner({
        type: "error",
        message: error instanceof ApiClientError ? error.message : "Failed to start eBay connection.",
      } satisfies NonNullable<BannerState>);
      setConnectingEbay(false);
    }
  };

  const handleConnectEtsy = async () => {
    setBanner(null);
    setConnectingEtsy(true);

    try {
      const data = await integrationApi.getEtsyConnectUrl();
      window.location.href = data.connectUrl;
    } catch (error) {
      setBanner({
        type: "error",
        message: error instanceof ApiClientError ? error.message : "Failed to start Etsy connection.",
      } satisfies NonNullable<BannerState>);
      setConnectingEtsy(false);
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
        description: "Connect your eBay seller account to prepare for future marketplace workflows in CommandCtr.",
        icon: <Layers className="h-5 w-5" />,
        themeBg: "bg-[#0064d2]",
        badgeText: ebayState.connected ? "CONNECTED" : null,
        interactive: true,
      },
      {
        id: "etsy",
        title: "Etsy",
        subtitle: "Handmade & Vintage",
        description: "Connect your Etsy shop to sync and manage your listings and handmade inventory in CommandCtr.",
        icon: <Gift className="h-5 w-5" />,
        themeBg: "bg-[#F1641E]",
        badgeText: etsyState.connected ? "CONNECTED" : null,
        interactive: true,
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
    [ebayState.connected, etsyState.connected, shopifyState.connected],
  );

  const renderCollapsedFooter = (platformId: string) => {
    if (platformId === "ebay") {
      return (
        <div className="collapsed-footer-content">
          <span className="text-xs font-semibold text-[#8ea4cb]">
            {ebayState.connected ? "Connected" : "Not Connected"}
          </span>
          <button
            className={`btn-premium btn-collapsed-action ${!ebayState.connected ? "active-connect" : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              if (!ebayState.connected) {
                void handleConnectEbay();
              }
            }}
            type="button"
            disabled={isConnectingEbay || ebayState.connected}
          >
            {isConnectingEbay ? "..." : ebayState.connected ? "Connected" : "Connect"}
          </button>
        </div>
      );
    }

    if (platformId === "etsy") {
      return (
        <div className="collapsed-footer-content">
          <span className="text-xs font-semibold text-[#8ea4cb]">
            {etsyState.connected ? "Connected" : "Not Connected"}
          </span>
          <button
            className={`btn-premium btn-collapsed-action ${!etsyState.connected ? "active-connect" : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              if (!etsyState.connected) {
                void handleConnectEtsy();
              }
            }}
            type="button"
            disabled={isConnectingEtsy || etsyState.connected}
          >
            {isConnectingEtsy ? "..." : etsyState.connected ? "Connected" : "Connect"}
          </button>
        </div>
      );
    }

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
          className="btn-premium btn-collapsed-action cursor-not-allowed opacity-60"
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
    if (platformId === "ebay") {
      if (!ebayState.connected) {
        return (
          <button
            className="btn-premium btn-primary-teal w-full sm:w-auto"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void handleConnectEbay();
            }}
            disabled={isConnectingEbay}
          >
            <Layers className="h-4 w-4" />
            {isConnectingEbay ? "Connecting..." : "Connect eBay"}
          </button>
        );
      }

      return (
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="btn-premium btn-secondary-outline text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void disconnectEbay();
            }}
            disabled={isDisconnectingEbay}
          >
            {isDisconnectingEbay ? "Disconnecting..." : "Disconnect"}
          </button>
        </div>
      );
    }

    if (platformId === "etsy") {
      if (!etsyState.connected) {
        return (
          <button
            className="btn-premium btn-primary-teal w-full sm:w-auto"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void handleConnectEtsy();
            }}
            disabled={isConnectingEtsy}
          >
            <Gift className="h-4 w-4" />
            {isConnectingEtsy ? "Connecting..." : "Connect Etsy"}
          </button>
        );
      }

      return (
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="btn-premium btn-secondary-outline text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void disconnectEtsy();
            }}
            disabled={isDisconnectingEtsy}
          >
            {isDisconnectingEtsy ? "Disconnecting..." : "Disconnect"}
          </button>
        </div>
      );
    }

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
              void syncProducts();
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
              void syncOrders();
            }}
            disabled={isSyncingOrders}
          >
            {isSyncingOrders ? "Syncing Orders..." : "Sync Orders"}
          </button>
          <button
            className="btn-premium btn-secondary-outline text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void disconnectShopify();
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
        className="btn-premium btn-secondary-outline cursor-not-allowed opacity-60"
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
                className="cursor-pointer text-current opacity-70 transition-opacity hover:opacity-100"
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
                                ? "border border-[#ccfbf1] bg-[#e6fcf5] text-[#0d9488]"
                                : "border border-[#e2e8f0] bg-[#f1f5f9] text-[#475569]"
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
                            {platform.id === "ebay" && ebayState.connected ? (
                              <div className="mt-3">
                                <span className="connected-store">
                                  Connected account: {ebayState.displayName || "eBay Seller"}
                                </span>
                              </div>
                            ) : null}
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
          <article className="animate-in fade-in zoom-in-95 w-full max-w-xl overflow-hidden rounded-2xl border border-[#2d3a5a] bg-[#131c35] text-white shadow-[0_30px_80px_-35px_rgba(17,31,56,0.9)] duration-200">
            <header className="flex items-center justify-between border-b border-[#243356] px-6 py-5">
              <div>
                <h3 className="text-2xl font-bold">{openPlatform}</h3>
                <p className="mt-1 text-sm text-[#8ea0c6]">This channel is planned for a future release. Shopify is the only active marketplace in the current MVP.</p>
              </div>
              <button
                className="cursor-pointer text-[#8ea0c6] transition-colors hover:text-white"
                onClick={() => setOpenPlatform(null)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-xl border border-[#243356] bg-[#1d2744] px-5 py-4 text-sm leading-relaxed text-[#cbd5e1]">
                {openPlatform} integration is currently marked as <strong>Coming Soon</strong>. Please use Shopify for the MVP flow.
              </div>
            </div>

            <footer className="flex items-center justify-end gap-3 border-t border-[#243356] px-6 py-5">
              <button
                className="btn-premium btn-secondary-outline border-white/10 text-white hover:bg-white/5 hover:text-white"
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
