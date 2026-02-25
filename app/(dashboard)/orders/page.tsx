"use client";

import {
  CheckCircle2,
  CloudUpload,
  Eye,
  Filter,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Truck,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type OrderStatus = "Shipped" | "Delivered" | "Pending";

type OrderRow = {
  id: string;
  orderId: string;
  platform: "AMAZON" | "EBAY" | "TIKTOK";
  customer: string;
  customerAvatarTone: string;
  customerInitials: string;
  items: string;
  amount: string;
  date: string;
  status: OrderStatus;
};

const initialOrders: OrderRow[] = [
  {
    id: "1",
    orderId: "#ORD-7782",
    platform: "AMAZON",
    customer: "Jane Cooper",
    customerAvatarTone: "from-[#f7d9c7] to-[#b48f78]",
    customerInitials: "JC",
    items: "3",
    amount: "+$25.99",
    date: "Oct 24, 2023",
    status: "Shipped",
  },
  {
    id: "2",
    orderId: "#ORD-7782",
    platform: "EBAY",
    customer: "Wade Warren",
    customerAvatarTone: "from-[#2f6f83] to-[#163948]",
    customerInitials: "WW",
    items: "3",
    amount: "+$25.99",
    date: "Oct 24, 2023",
    status: "Shipped",
  },
  {
    id: "3",
    orderId: "#ORD-7782",
    platform: "TIKTOK",
    customer: "Jenny Wilson",
    customerAvatarTone: "from-[#efdbc6] to-[#b98f6f]",
    customerInitials: "JW",
    items: "3",
    amount: "+$25.99",
    date: "Oct 24, 2023",
    status: "Delivered",
  },
  {
    id: "4",
    orderId: "#ORD-7782",
    platform: "AMAZON",
    customer: "Jane Cooper",
    customerAvatarTone: "from-[#f7d9c7] to-[#b48f78]",
    customerInitials: "JC",
    items: "3",
    amount: "+$25.99",
    date: "Oct 24, 2023",
    status: "Delivered",
  },
  {
    id: "5",
    orderId: "#ORD-7782",
    platform: "AMAZON",
    customer: "Jane Cooper",
    customerAvatarTone: "from-[#f7d9c7] to-[#b48f78]",
    customerInitials: "JC",
    items: "3",
    amount: "+$25.99",
    date: "Oct 24, 2023",
    status: "Shipped",
  },
];

function PlatformBadge({ platform }: { platform: OrderRow["platform"] }) {
  if (platform === "AMAZON") {
    return <span className="rounded-full bg-[#f8a100] px-3 py-1 text-xs font-semibold text-white">AMAZON</span>;
  }

  if (platform === "EBAY") {
    return <span className="rounded-full bg-[#0b72de] px-3 py-1 text-xs font-semibold text-white">EBAY</span>;
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

  return <span className="rounded-full bg-[#ddf7f0] px-3 py-1 text-xs font-semibold text-[#56cbc2]">Shipped</span>;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [globalEditMode, setGlobalEditMode] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return orders;
    }

    return orders.filter((order) => {
      return (
        order.orderId.toLowerCase().includes(query) ||
        order.customer.toLowerCase().includes(query) ||
        order.platform.toLowerCase().includes(query)
      );
    });
  }, [orders, searchQuery]);

  const updateItems = (id: string, value: string) => {
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, items: value } : order)));
  };

  const removeOrder = (id: string) => {
    setOrders((prev) => prev.filter((order) => order.id !== id));
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
                <span className="rounded-full bg-[#113c60] px-2 py-0.5 text-[10px] text-[#53e1d6]">+12%</span>
              </div>
              <p className="text-sm text-[#c0cce4]">Total Orders</p>
              <p className="mt-1 text-3xl font-semibold">1,240</p>
            </div>

            <div className="rounded-xl bg-[#1a2748] p-4 text-white">
              <div className="mb-3 flex items-center justify-between">
                <Package className="h-4 w-4 text-[#f8a100]" />
                <span className="rounded-full bg-[#113c60] px-2 py-0.5 text-[10px] text-[#53e1d6]">+5%</span>
              </div>
              <p className="text-sm text-[#c0cce4]">Pending</p>
              <p className="mt-1 text-3xl font-semibold">45</p>
            </div>

            <div className="rounded-xl bg-[#1a2748] p-4 text-white">
              <div className="mb-3 flex items-center justify-between">
                <Truck className="h-4 w-4 text-[#7a6cff]" />
                <span className="rounded-full bg-[#113c60] px-2 py-0.5 text-[10px] text-[#53e1d6]">-2%</span>
              </div>
              <p className="text-sm text-[#c0cce4]">Shipped</p>
              <p className="mt-1 text-3xl font-semibold">850</p>
            </div>

            <div className="rounded-xl bg-[#1a2748] p-4 text-white">
              <div className="mb-3 flex items-center justify-between">
                <CheckCircle2 className="h-4 w-4 text-[#35d3ce]" />
                <span className="rounded-full bg-[#113c60] px-2 py-0.5 text-[10px] text-[#53e1d6]">+12%</span>
              </div>
              <p className="text-sm text-[#c0cce4]">Delivered</p>
              <p className="mt-1 text-3xl font-semibold">350</p>
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
              type="button"
            >
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex h-11 items-center gap-3 rounded-full border border-[#d7deeb] bg-[#eaf2fd] px-4 text-sm font-semibold text-[#33466a]">
              Global Edit Mode
              <button
                className={`relative h-6 w-12 rounded-full transition ${globalEditMode ? "bg-[#1f2d4d]" : "bg-[#c8d2e5]"}`}
                onClick={() => setGlobalEditMode((prev) => !prev)}
                type="button"
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    globalEditMode ? "left-6" : "left-0.5"
                  }`}
                />
              </button>
            </label>

            <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#d5dcea] bg-white px-5 text-sm font-semibold text-[#465574]" type="button">
              <CloudUpload className="h-4 w-4" />
              Import
            </button>
            <button className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#172544] px-5 text-sm font-semibold text-white" type="button">
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>
        </div>

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
                {filteredOrders.map((order) => {
                  const canEditItems = globalEditMode || editingRowId === order.id;

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
                          <Link className="text-[#1c2438]" href={`/orders/${order.orderId.replace("#", "")}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="border-t border-[#edf1f7] px-4 py-6 text-center text-sm text-[#6f7f9f]">No orders found.</div>
          ) : null}
        </article>
      </div>
    </section>
  );
}
