"use client";

import {
  CheckCircle2,
  CloudUpload,
  Eye,
  Filter,
  Loader2,
  Package,
  Pencil,
  Search,
  ShoppingCart,
  Truck,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiClientError } from "@/lib/auth";
import { ordersApi, type OrderRecord, type OrderStats, type OrderStatus } from "@/lib/orders";

type OrderPlatform = "AMAZON" | "EBAY" | "TIKTOK" | "SHOPIFY" | "OTHER";

type OrderRow = {
  id: string;
  orderId: string;
  platform: OrderPlatform;
  customer: string;
  customerAvatarTone: string;
  customerInitials: string;
  items: string;
  amount: string;
  date: string;
  status: OrderStatus;
};

const emptyStats: OrderStats = {
  totalOrders: 0,
  pending: 0,
  shipped: 0,
  delivered: 0,
  cancelled: 0
};

function getDocumentId(order: OrderRecord) {
  return order._id ?? order.id ?? order.externalOrderId ?? order.shopifyOrderId ?? order.orderName ?? "";
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "O").concat(parts[1]?.[0] ?? "").toUpperCase();
}

function mapPlatform(marketplace?: string): OrderPlatform {
  const value = marketplace?.toUpperCase();
  if (value === "AMAZON" || value === "EBAY" || value === "TIKTOK" || value === "SHOPIFY") {
    return value;
  }
  return "OTHER";
}

function formatOrderAmount(order: OrderRecord) {
  const numericAmount = Number(order.totalPrice ?? 0);
  const currency = order.currency || "USD";

  try {
    return `${numericAmount >= 0 ? "+" : ""}${new Intl.NumberFormat("en-US", {
      style: "currency",
      currency
    }).format(numericAmount)}`;
  } catch {
    return `${numericAmount >= 0 ? "+" : ""}$${numericAmount.toFixed(2)}`;
  }
}

function formatOrderDate(value?: string) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function mapOrderRows(orders: OrderRecord[]): OrderRow[] {
  return orders.map((order, index) => {
    const customer = order.customerName || order.email || "Unknown Customer";
    const itemCount = (order.lineItems ?? []).reduce((sum, item) => sum + (item.quantity ?? 0), 0);

    return {
      id: getDocumentId(order),
      orderId: order.orderName ?? order.externalOrderId ?? order.shopifyOrderId ?? "--",
      platform: mapPlatform(order.marketplace),
      customer,
      customerAvatarTone:
        index % 3 === 0
          ? "from-[#f7d9c7] to-[#b48f78]"
          : index % 3 === 1
            ? "from-[#2f6f83] to-[#163948]"
            : "from-[#efdbc6] to-[#b98f6f]",
      customerInitials: getInitials(customer),
      items: String(itemCount || (order.lineItems ?? []).length),
      amount: formatOrderAmount(order),
      date: formatOrderDate(order.processedAt),
      status: order.status ?? "Pending"
    };
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatStatPercent(value: number, total: number) {
  if (!total) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}

function PlatformBadge({ platform }: { platform: OrderRow["platform"] }) {
  if (platform === "AMAZON") {
    return <span className="rounded-full bg-[#f8a100] px-3 py-1 text-xs font-semibold text-white">AMAZON</span>;
  }

  if (platform === "EBAY") {
    return <span className="rounded-full bg-[#0b72de] px-3 py-1 text-xs font-semibold text-white">EBAY</span>;
  }

  if (platform === "SHOPIFY") {
    return <span className="rounded-full bg-[#1f7a43] px-3 py-1 text-xs font-semibold text-white">SHOPIFY</span>;
  }

  if (platform === "OTHER") {
    return <span className="rounded-full bg-[#60708d] px-3 py-1 text-xs font-semibold text-white">OTHER</span>;
  }

  return (
    <span className="rounded-full bg-gradient-to-r from-[#00d4d1] via-[#0ea4d6] to-[#eb0f67] px-3 py-1 text-xs font-semibold text-white">
      TIKTOK
    </span>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  if (status === "Delivered") {
    return <span className="rounded-full bg-[#d9efff] px-3 py-1 text-xs font-semibold text-[#4aa6ff]">Delivered</span>;
  }

  if (status === "Pending") {
    return <span className="rounded-full bg-[#fff2d6] px-3 py-1 text-xs font-semibold text-[#f4a632]">Pending</span>;
  }

  if (status === "Cancelled") {
    return <span className="rounded-full bg-[#ffe4ef] px-3 py-1 text-xs font-semibold text-[#ef4a89]">Cancelled</span>;
  }

  return <span className="rounded-full bg-[#ddf7f0] px-3 py-1 text-xs font-semibold text-[#56cbc2]">Shipped</span>;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [stats, setStats] = useState<OrderStats>(emptyStats);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageMessage, setPageMessage] = useState("");
  const totalOrdersPercent = stats.totalOrders ? "100%" : "0%";
  const pendingPercent = formatStatPercent(stats.pending, stats.totalOrders);
  const shippedPercent = formatStatPercent(stats.shipped, stats.totalOrders);
  const deliveredPercent = formatStatPercent(stats.delivered, stats.totalOrders);

  const fetchOrders = useCallback(async (search = searchQuery) => {
    const response = await ordersApi.getOrders({
      search: search.trim() || undefined,
      limit: 100
    });
    return response;
  }, [searchQuery]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void fetchOrders(searchQuery)
        .then((response) => {
          if (!active) {
            return;
          }

          setOrders(mapOrderRows(response.items));
          setStats(response.stats);
        })
        .catch((error) => {
          if (!active) {
            return;
          }
          setPageMessage(error instanceof ApiClientError ? error.message : "Could not load orders.");
        })
        .finally(() => {
          if (active) {
            setIsLoading(false);
          }
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [fetchOrders, searchQuery]);

  const filteredOrders = useMemo(() => orders, [orders]);

  const updateItems = (id: string, value: string) => {
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, items: value } : order)));
  };

  const removeOrder = (id: string) => {
    setOrders((prev) => prev.filter((order) => order.id !== id));
  };

  const handleExport = async () => {
    setPageMessage("");

    try {
      const blob = await ordersApi.exportCsv({
        search: searchQuery.trim() || undefined,
        limit: 100
      });
      downloadBlob(blob, `orders-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (error) {
      setPageMessage(error instanceof Error ? error.message : "Could not export orders.");
    }
  };

  return (
    <section className="px-4 py-5 md:px-8 md:py-8">
      <div className="space-y-5">
        <div className="rounded-xl border border-[#2c3b61] bg-[#1b2748] px-4 py-4 text-white md:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-xl font-semibold">Unified Order Feed</h1>
              <p className="mt-1 text-sm text-[#a9b8d6]">Manage stock levels across Amazon, TikTok, and eBay</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#cbd6ea] bg-white px-4 text-sm font-semibold text-[#425370]"
                type="button"
              >
                <Filter className="h-4 w-4" />
                Adjust Safety Buffer
              </button>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#35d3ce] px-4 text-sm font-semibold text-white"
                onClick={() => void handleExport()}
                type="button"
              >
                <CloudUpload className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        <article className="rounded-2xl border border-[#dbe2ee] bg-white p-4 shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)] md:p-5">
          <h2 className="text-lg font-semibold text-[#1f2c44]">Product Optimization</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-[#1a2748] p-4 text-white">
              <div className="mb-3 flex items-center justify-between">
                <ShoppingCart className="h-4 w-4 text-[#4aa6ff]" />
                <span className="rounded-full bg-[#113c60] px-2 py-0.5 text-[10px] text-[#53e1d6]">{totalOrdersPercent}</span>
              </div>
              <p className="text-sm text-[#c0cce4]">Total Orders</p>
              <p className="mt-1 text-3xl font-semibold">{stats.totalOrders}</p>
            </div>

            <div className="rounded-xl bg-[#1a2748] p-4 text-white">
              <div className="mb-3 flex items-center justify-between">
                <Package className="h-4 w-4 text-[#f8a100]" />
                <span className="rounded-full bg-[#113c60] px-2 py-0.5 text-[10px] text-[#53e1d6]">{pendingPercent}</span>
              </div>
              <p className="text-sm text-[#c0cce4]">Pending</p>
              <p className="mt-1 text-3xl font-semibold">{stats.pending}</p>
            </div>

            <div className="rounded-xl bg-[#1a2748] p-4 text-white">
              <div className="mb-3 flex items-center justify-between">
                <Truck className="h-4 w-4 text-[#7a6cff]" />
                <span className="rounded-full bg-[#113c60] px-2 py-0.5 text-[10px] text-[#53e1d6]">{shippedPercent}</span>
              </div>
              <p className="text-sm text-[#c0cce4]">Shipped</p>
              <p className="mt-1 text-3xl font-semibold">{stats.shipped}</p>
            </div>

            <div className="rounded-xl bg-[#1a2748] p-4 text-white">
              <div className="mb-3 flex items-center justify-between">
                <CheckCircle2 className="h-4 w-4 text-[#35d3ce]" />
                <span className="rounded-full bg-[#113c60] px-2 py-0.5 text-[10px] text-[#53e1d6]">{deliveredPercent}</span>
              </div>
              <p className="text-sm text-[#c0cce4]">Delivered</p>
              <p className="mt-1 text-3xl font-semibold">{stats.delivered}</p>
            </div>
          </div>
        </article>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-3 md:flex-row lg:max-w-[710px]">
            <div className="relative w-full md:max-w-[390px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#96a3bc]" />
              <input
                className="h-11 w-full rounded-xl border border-[#d6dce9] bg-white py-2 pl-10 pr-3 text-sm text-[#243251] outline-none placeholder:text-[#8f9bb1] focus:border-[#98abcf]"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name, SKU, or ASIN..."
                type="text"
                value={searchQuery}
              />
            </div>

            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d5dcea] bg-white px-5 text-sm font-semibold text-[#465574]"
              onClick={() => void fetchOrders()}
              type="button"
            >
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>
        </div>

        {pageMessage ? (
          <div className="rounded-xl border border-[#dbe2ee] bg-white px-4 py-3 text-sm text-[#4e5f82] shadow-[0_12px_26px_-24px_rgba(17,31,56,0.85)]">
            {pageMessage}
          </div>
        ) : null}

        <article className="overflow-hidden rounded-2xl border border-[#e1e6f0] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead className="bg-[#233a69] text-xs font-semibold uppercase tracking-wide text-[#d8e4fb]">
                <tr>
                  <th className="px-4 py-4">Order ID</th>
                  <th className="px-4 py-4">Platform</th>
                  <th className="px-4 py-4">Customer</th>
                  <th className="px-4 py-4 text-center">Items</th>
                  <th className="px-4 py-4">Amount</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Available</th>
                  <th className="px-4 py-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-12 text-center text-sm text-[#6f7f9f]" colSpan={8}>
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading orders...
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const canEditItems = editingRowId === order.id;

                    return (
                      <tr className="border-t border-[#e9eef7] text-sm text-[#44526d]" key={order.id}>
                        <td className="px-4 py-5 font-semibold text-[#4b5b7a]">{order.orderId}</td>
                        <td className="px-4 py-5">
                          <PlatformBadge platform={order.platform} />
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-semibold text-white ${order.customerAvatarTone}`}
                            >
                              {order.customerInitials}
                            </span>
                            <p className="font-medium text-[#3c4d6c]">{order.customer}</p>
                          </div>
                        </td>
                        <td className="px-4 py-5 text-center">
                          {canEditItems ? (
                            <input
                              className="mx-auto h-8 w-14 rounded-lg border border-[#cfd8e7] bg-white px-2 text-center text-sm font-semibold text-[#3f4d65] outline-none"
                              onChange={(event) => updateItems(order.id, event.target.value)}
                              type="number"
                              value={order.items}
                            />
                          ) : (
                            <div className="mx-auto h-8 w-14 rounded-lg border border-[#d8e1ee] bg-[#f7f9fd] px-2 py-1.5 text-center text-sm font-semibold text-[#6b7c99]">
                              {order.items}
                            </div>
                          )}
                          <p className="mt-1 text-[11px] text-[#8acfd6]">Items</p>
                        </td>
                        <td className="px-4 py-5 font-semibold text-[#4a5b78]">{order.amount}</td>
                        <td className="px-4 py-5 text-[#7e8fae]">{order.date}</td>
                        <td className="px-4 py-5">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              className="text-[#223763]"
                              onClick={() => setEditingRowId((prev) => (prev === order.id ? null : order.id))}
                              type="button"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button className="text-[#f03f8f]" onClick={() => removeOrder(order.id)} type="button">
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <Link className="text-[#1c2438]" href={`/orders/${order.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && filteredOrders.length === 0 ? (
            <div className="border-t border-[#edf1f7] px-4 py-6 text-center text-sm text-[#6f7f9f]">No orders found.</div>
          ) : null}
        </article>
      </div>
    </section>
  );
}
