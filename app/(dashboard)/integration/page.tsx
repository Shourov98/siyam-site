"use client";

import { Check, Gift, Layers, Moon, ShoppingBag, Store, University, X } from "lucide-react";
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

const AmazonIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.1 3.5c-3.2 0-5.8 2-5.8 5.2c0 2.7 1.9 4.3 4.3 4.3c2.2 0 3.7-1.3 4.1-2.3v2.1h3.1V6.1c0-4-2.7-5.5-6-5.5c-3.2 0-5.8 1.4-6.4 3.7-.1.5.1.7.5.8l2.2.4c.4.1.7-.1.8-.4.3-1.1 1.4-1.9 2.9-1.9c1.6 0 2.7.9 2.7 2.6v.9c-.8-.7-2.1-1.3-3.7-1.3zm.5 6.6c-1.5 0-2.4-1-2.4-2.5c0-1.6.9-2.5 2.4-2.5c1.5 0 2.3 1 2.3 2.5c0 1.5-.8 2.5-2.3 2.5z" fill="currentColor"/>
    <path d="M1.5 18c6 4 14.5 4.8 21.5 2c1-.4 1.9-.9 2.7-1.5c.4-.3.6-.1.3.3c-1.3 1.7-3.4 3.2-5.8 4.1c-6.4 2.5-15.1 1.8-21.3-2.1c-.5-.3-.9-.9-.2-.9c.7 0 1.9.4 2.8.8z" fill="#f8a100"/>
    <path d="M23.5 17c-.4-.5-1.4-.3-2.1-.1c-.8.2-1.8.6-2.6.9c-.3.1-.3.3-.1.4c1 1 2.6 1.8 3.5.6c.3-.3.4-1.1.2-1.6c-.2-.2-.5 0-.9-.2z" fill="#f8a100"/>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.5 2v12.5c0 1.93-1.57 3.5-3.5 3.5S5.5 16.43 5.5 14.5s1.57-3.5 3.5-3.5c.35 0 .68.05 1 .15V7.12C9.67 7.04 9.34 7 9 7c-4.14 0-7.5 3.36-7.5 7.5S4.86 22 9 22c4.14 0 7.5-3.36 7.5-7.5V7.25c1.45.97 3.16 1.55 5 1.63V4.85c-1.92-.08-3.68-.84-5-2.05L12.5 2z" fill="currentColor" />
  </svg>
);

const EbayIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
    <text x="50" y="29" textAnchor="middle" fontSize="30" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="bold" letterSpacing="-2.5">
      <tspan fill="#e53238">e</tspan>
      <tspan fill="#0064d2" dy="-2">b</tspan>
      <tspan fill="#f5af02" dy="2">a</tspan>
      <tspan fill="#86b817" dy="-1">y</tspan>
    </text>
  </svg>
);

const EtsyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
    <text x="50" y="29" textAnchor="middle" fontSize="28" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="bold" fill="#F1641E" letterSpacing="-1.5">
      Etsy
    </text>
  </svg>
);

const ShopifyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 108.44 122.88" xmlns="http://www.w3.org/2000/svg">
    <g>
      <path d="M94.98,23.66c-0.09-0.62-0.63-0.96-1.08-1c-0.45-0.04-9.19-0.17-9.19-0.17s-7.32-7.1-8.04-7.83 c-0.72-0.72-2.13-0.5-2.68-0.34c-0.01,0-1.37,0.43-3.68,1.14c-0.38-1.25-0.95-2.78-1.76-4.32c-2.6-4.97-6.42-7.6-11.03-7.61 c-0.01,0-0.01,0-0.02,0c-0.32,0-0.64,0.03-0.96,0.06c-0.14-0.16-0.27-0.32-0.42-0.48c-2.01-2.15-4.58-3.19-7.67-3.1 c-5.95,0.17-11.88,4.47-16.69,12.11c-3.38,5.37-5.96,12.12-6.69,17.35c-6.83,2.12-11.61,3.6-11.72,3.63 c-3.45,1.08-3.56,1.19-4.01,4.44C9.03,39.99,0,109.8,0,109.8l75.65,13.08l32.79-8.15C108.44,114.73,95.06,24.28,94.98,23.66 L94.98,23.66z M66.52,16.63c-1.74,0.54-3.72,1.15-5.87,1.82c-0.04-3.01-0.4-7.21-1.81-10.83C63.36,8.47,65.58,13.58,66.52,16.63 L66.52,16.63z M56.69,19.68c-3.96,1.23-8.29,2.57-12.63,3.91c1.22-4.67,3.54-9.33,6.38-12.38c1.06-1.14,2.54-2.4,4.29-3.12 C56.38,11.52,56.73,16.39,56.69,19.68L56.69,19.68z M48.58,3.97c1.4-0.03,2.57,0.28,3.58,0.94C50.55,5.74,49,6.94,47.54,8.5 c-3.78,4.06-6.68,10.35-7.83,16.43c-3.6,1.11-7.13,2.21-10.37,3.21C31.38,18.58,39.4,4.23,48.58,3.97L48.58,3.97z" fill="#95BF47" />
      <path d="M93.9,22.66c-0.45-0.04-9.19-0.17-9.19-0.17s-7.32-7.1-8.04-7.83c-0.27-0.27-0.63-0.41-1.02-0.47l0,108.68 l32.78-8.15c0,0-13.38-90.44-13.46-91.06C94.9,23.04,94.35,22.7,93.9,22.66L93.9,22.66z" fill="#5E8E3E" />
      <path d="M57.48,39.52l-3.81,14.25c0,0-4.25-1.93-9.28-1.62c-7.38,0.47-7.46,5.12-7.39,6.29 c0.4,6.37,17.16,7.76,18.11,22.69c0.74,11.74-6.23,19.77-16.27,20.41c-12.05,0.76-18.69-6.35-18.69-6.35l2.55-10.86 c0,0,6.68,5.04,12.02,4.7c3.49-0.22,4.74-3.06,4.61-5.07c-0.52-8.31-14.18-7.82-15.04-21.48c-0.73-11.49,6.82-23.14,23.48-24.19 C54.2,37.88,57.48,39.52,57.48,39.52L57.48,39.52z" fill="white" />
    </g>
  </svg>
);

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
      shopifyState.scopes.join("|") === initialShopifyState.scopes.join("|") &&
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
        icon: <AmazonIcon className="h-6 w-6" />,
        themeBg: "bg-[#f8a100]",
        badgeText: "COMING SOON",
        interactive: false,
      },
      {
        id: "tiktok",
        title: "TikTok Shop",
        subtitle: "Social Commerce",
        description: "TikTok Shop remains disabled for this MVP release.",
        icon: <TikTokIcon className="h-6 w-6" />,
        themeBg: "bg-[#ff0050]",
        badgeText: "COMING SOON",
        interactive: false,
      },
      {
        id: "ebay",
        title: "eBay",
        subtitle: "Global Retail",
        description: "Connect your eBay seller account to prepare for future marketplace workflows in CommandCtr.",
        icon: <EbayIcon className="h-6 w-16" />,
        themeBg: "bg-[#0064d2]",
        badgeText: ebayState.connected ? "CONNECTED" : null,
        interactive: true,
      },
      {
        id: "etsy",
        title: "Etsy",
        subtitle: "Handmade & Vintage",
        description: "Connect your Etsy shop to sync and manage your listings and handmade inventory in CommandCtr.",
        icon: <EtsyIcon className="h-6 w-16" />,
        themeBg: "bg-[#F1641E]",
        badgeText: etsyState.connected ? "CONNECTED" : null,
        interactive: true,
      },
      {
        id: "shopify",
        title: "Shopify",
        subtitle: "Web Storefront",
        description: "Sync products, customers, and orders seamlessly with your custom Shopify storefront using our API.",
        icon: <ShopifyIcon className="h-6 w-6" />,
        themeBg: "bg-[#95bf47]",
        badgeText: shopifyState.connected ? "CONNECTED" : null,
        interactive: true,
      },
    ],
    [ebayState.connected, etsyState.connected, shopifyState.connected],
  );

  const shopifyMissingScopes = useMemo(
    () => ["read_publications", "write_publications"].filter((scope) => !shopifyState.scopes.includes(scope)),
    [shopifyState.scopes],
  );

  const renderCollapsedFooter = (platformId: string) => {
    if (platformId === "ebay") {
      return (
        <div className="collapsed-footer-content">
          {ebayState.connected ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              Connected
            </span>
          ) : (
            <>
              <span className="text-xs font-semibold text-[#8ea4cb]">Not Connected</span>
              <button
                className="btn-premium btn-collapsed-action active-connect"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleConnectEbay();
                }}
                type="button"
                disabled={isConnectingEbay}
              >
                {isConnectingEbay ? "..." : "Connect"}
              </button>
            </>
          )}
        </div>
      );
    }

    if (platformId === "etsy") {
      return (
        <div className="collapsed-footer-content">
          {etsyState.connected ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              Connected
            </span>
          ) : (
            <>
              <span className="text-xs font-semibold text-[#8ea4cb]">Not Connected</span>
              <button
                className="btn-premium btn-collapsed-action active-connect"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleConnectEtsy();
                }}
                type="button"
                disabled={isConnectingEtsy}
              >
                {isConnectingEtsy ? "..." : "Connect"}
              </button>
            </>
          )}
        </div>
      );
    }

    if (platformId === "shopify") {
      return (
        <div className="collapsed-footer-content">
          {isLoadingStatus ? (
            <span className="text-xs font-semibold text-[#8ea4cb]">Checking status...</span>
          ) : shopifyState.connected ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              Connected
            </span>
          ) : (
            <>
              <span className="text-xs font-semibold text-[#8ea4cb]">Not Connected</span>
              <button
                className="btn-premium btn-collapsed-action active-connect"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleConnectShopify();
                }}
                type="button"
                disabled={isConnectingShopify}
              >
                {isConnectingShopify ? "..." : "Connect"}
              </button>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="collapsed-footer-content">
        <span className="text-xs font-semibold text-[#8ea4cb]">Coming Soon</span>
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
              <div className="stepper-line-active" style={{ width: "100%" }} />
              <Step completed icon={<ShoppingBag className="h-4 w-4" />} label="Identity" />
              <Step completed icon={<University className="h-4 w-4" />} label="Banking" />
              <Step active icon={<Store className="h-4 w-4" />} label="Marketplace" />
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
                            {platform.id === "etsy" && etsyState.connected ? (
                              <div className="mt-3">
                                <span className="connected-store">
                                  Connected account: {etsyState.displayName || "Etsy Shop"}
                                </span>
                              </div>
                            ) : null}
                            {platform.id === "shopify" && shopifyState.connected && shopifyState.shopDomain ? (
                              <div className="mt-3 space-y-2">
                                <span className="connected-store">
                                  Connected store: {shopifyState.shopDomain}
                                </span>
                                <div className="rounded-xl border border-[#dbe2ee] bg-[#f8fbff] px-3 py-2">
                                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8093b2]">Granted Shopify scopes</div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {shopifyState.scopes.length > 0 ? (
                                      shopifyState.scopes.map((scope) => (
                                        <span
                                          key={scope}
                                          className="inline-flex items-center rounded-full border border-[#dbe2ee] bg-white px-2.5 py-1 text-[11px] font-medium text-[#4a5d7d]"
                                        >
                                          {scope}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-xs text-[#8ea0bf]">No granted scopes recorded yet.</span>
                                    )}
                                  </div>
                                  {shopifyMissingScopes.length > 0 ? (
                                    <div className="mt-2 text-xs font-medium text-amber-700">
                                      Missing for Online Store publishing: {shopifyMissingScopes.join(", ")}. Reconnect Shopify after enabling these scopes in the Shopify app config.
                                    </div>
                                  ) : (
                                    <div className="mt-2 text-xs font-medium text-emerald-700">
                                      Publication scopes are present.
                                    </div>
                                  )}
                                </div>
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
