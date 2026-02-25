"use client";

import { CircleHelp, MessageCircle, Minimize2, Paperclip, Search, SendHorizontal, UploadCloud, X } from "lucide-react";
import { useMemo, useState } from "react";

type TicketStatus = "Resolved" | "Pending" | "Active" | "Closed";

type Ticket = {
  id: string;
  ticketId: string;
  subject: string;
  status: TicketStatus;
  lastUpdated: string;
};

type ChatMessage = {
  id: string;
  author: "Sarah" | "You";
  time: string;
  text: string;
};

const initialTickets: Ticket[] = [
  { id: "1", ticketId: "#1024", subject: "API Sync Error (Amazon)", status: "Resolved", lastUpdated: "2h ago" },
  { id: "2", ticketId: "#1024", subject: "Unauthorized Trans", status: "Pending", lastUpdated: "4h ago" },
  { id: "3", ticketId: "#1024", subject: "Damaged Item", status: "Active", lastUpdated: "1d ago" },
  { id: "4", ticketId: "#1024", subject: "API Sync Error (Amazon)", status: "Closed", lastUpdated: "2d ago" },
];

function StatusBadge({ status }: { status: TicketStatus }) {
  if (status === "Resolved") {
    return <span className="rounded-full bg-[#ddf7f0] px-3 py-1 text-xs font-semibold text-[#56cbc2]">Resolved</span>;
  }

  if (status === "Pending") {
    return <span className="rounded-full bg-[#fff2d6] px-3 py-1 text-xs font-semibold text-[#f4a632]">Pending</span>;
  }

  if (status === "Active") {
    return <span className="rounded-full bg-[#d9efff] px-3 py-1 text-xs font-semibold text-[#4aa6ff]">Active</span>;
  }

  return <span className="rounded-full bg-[#eff1f5] px-3 py-1 text-xs font-semibold text-[#9aa6b8]">Closed</span>;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [query, setQuery] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "1", author: "Sarah", time: "10:02 AM", text: "Hi there! How can I help you with your order today?" },
    { id: "2", author: "You", time: "10:03 AM", text: "I'm having trouble finding the invoice for last month." },
    { id: "3", author: "Sarah", time: "10:04 AM", text: "No problem, I can pull that up for you. One moment." },
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return tickets;
    }

    return tickets.filter((t) => t.subject.toLowerCase().includes(q) || t.ticketId.toLowerCase().includes(q));
  }, [tickets, query]);

  const resolveTicket = (id: string) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: "Resolved" } : t)));
  };

  const sendChatMessage = () => {
    const content = chatInput.trim();
    if (!content) {
      return;
    }

    const now = new Date();
    const hh = now.getHours();
    const mm = now.getMinutes().toString().padStart(2, "0");
    const ampm = hh >= 12 ? "PM" : "AM";
    const displayHour = ((hh + 11) % 12) + 1;

    setChatMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        author: "You",
        time: `${displayHour}:${mm} ${ampm}`,
        text: content,
      },
    ]);
    setChatInput("");
  };

  return (
    <>
      <section className="px-4 py-5 md:px-8 md:py-8">
        <div className="space-y-4">
        <header className="rounded-xl border border-[#2c3b61] bg-[#1b2748] px-5 py-5 text-white">
          <h1 className="text-2xl font-semibold">Support Center</h1>
          <p className="mt-1 text-sm text-[#a9b8d6]">How can we help you today?</p>
        </header>

        <article className="rounded-xl border border-[#2c3b61] bg-[#1b2748] p-4 text-white md:p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#b9c6df]">Related Order / Dispute ID (Optional)</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#96a3bc]" />
                <input
                  className="h-11 w-full rounded-xl border border-[#d6dce9] bg-white py-2 pl-10 pr-3 text-sm text-[#243251] outline-none placeholder:text-[#8f9bb1]"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search Order ID # or Dispute ID..."
                  type="text"
                  value={query}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-[#b9c6df]">Subject</label>
              <input
                className="h-11 w-full rounded-xl border border-[#d6dce9] bg-white px-3 py-2 text-sm text-[#243251] outline-none placeholder:text-[#8f9bb1]"
                placeholder="Brief summary of the issue"
                type="text"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-[#b9c6df]">Description</label>
            <div className="overflow-hidden rounded-xl border border-[#8fa3c9] bg-white">
              <div className="flex h-8 items-center gap-3 bg-[#233a69] px-3 text-xs font-semibold text-[#dbe7ff]">
                <button type="button">B</button>
                <button className="italic" type="button">I</button>
                <button className="underline" type="button">U</button>
                <button type="button">☰</button>
                <button type="button">◉</button>
              </div>
              <textarea
                className="h-40 w-full resize-none px-3 py-3 text-sm text-[#2f405d] outline-none"
                placeholder="Please provide detailed information about the issue..."
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-[#b9c6df]">Attachments</label>
            <div className="rounded-xl border border-dashed border-[#8ea2c7] bg-white px-4 py-8 text-center text-[#2f405d]">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#35d3ce] text-[#0f3d57]">
                <UploadCloud className="h-5 w-5" />
              </div>
              <p className="font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-[#98a8c2]">SVG, PNG, JPG or GIF (max. 800x400px)</p>
            </div>
          </div>

          <div className="mt-5 grid gap-2 md:grid-cols-2">
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#35d3ce] text-sm font-semibold text-white" type="button">
              <CircleHelp className="h-4 w-4" />
              Submit Ticket
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#7b8fb7] bg-[#1b2748] text-sm font-semibold text-[#dce6ff]"
              onClick={() => setIsChatOpen(true)}
              type="button"
            >
              <MessageCircle className="h-4 w-4" />
              Live Chat
            </button>
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-[#e1e6f0] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-[#233a69] text-xs font-semibold uppercase tracking-wide text-[#d8e4fb]">
                <tr>
                  <th className="px-4 py-4">Ticket ID</th>
                  <th className="px-4 py-4">Subject</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-center">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ticket) => (
                  <tr className="border-t border-[#e9eef7] text-sm text-[#44526d]" key={ticket.id}>
                    <td className="px-4 py-4 font-semibold text-[#4b5b7a]">{ticket.ticketId}</td>
                    <td className="px-4 py-4 text-[#5e7192]">{ticket.subject}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="rounded-lg border border-[#d5dcea] bg-[#f7f9fd] px-3 py-1.5 text-xs font-semibold text-[#60708d]" type="button">
                          View Details
                        </button>
                        <button
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                            ticket.status === "Pending" || ticket.status === "Closed"
                              ? "border border-[#d5dcea] bg-[#f7f9fd] text-[#9caac4]"
                              : "bg-[#35d3ce] text-white"
                          }`}
                          disabled={ticket.status === "Pending" || ticket.status === "Closed"}
                          onClick={() => resolveTicket(ticket.id)}
                          type="button"
                        >
                          Resolve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[#e5ebf5] px-5 py-3 text-sm text-[#6f809f]">
            <p>Showing 1 to {Math.min(filtered.length, 4)} of 128 results</p>
            <div className="flex items-center gap-2">
              <button className="rounded-xl border border-[#c7d3e6] px-4 py-1.5 font-semibold text-[#60708d]" type="button">
                Previous
              </button>
              <button className="rounded-xl border border-[#c7d3e6] px-4 py-1.5 font-semibold text-[#60708d]" type="button">
                Next
              </button>
            </div>
          </div>
        </article>
        </div>
      </section>

      {isChatOpen ? (
        <aside className="fixed bottom-4 right-4 z-50 w-[360px] overflow-hidden rounded-xl border border-[#8ea2c7] bg-white shadow-[0_30px_70px_-30px_rgba(12,26,58,0.75)]">
          <header className="bg-[#1b2748] px-4 py-3 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#d8b294] to-[#8a624a] text-sm font-semibold">
                  S
                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#1b2748] bg-[#42db8c]" />
                </span>
                <div>
                  <p className="text-2xl font-semibold">Chat with Sarah</p>
                  <p className="text-sm text-[#b6c5e1]">● Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-[#39ded8]" onClick={() => setIsChatOpen(false)} type="button">
                  <Minimize2 className="h-4 w-4" />
                </button>
                <button className="text-[#39ded8]" onClick={() => setIsChatOpen(false)} type="button">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>

          <div className="max-h-[430px] overflow-y-auto bg-white px-4 py-4">
            <p className="mx-auto mb-4 w-fit rounded-full bg-[#edf2fa] px-4 py-1 text-xs font-semibold text-[#97a8c3]">Today</p>

            {chatMessages.map((message) => {
              const isUser = message.author === "You";
              return (
                <div className={`mb-4 ${isUser ? "text-right" : ""}`} key={message.id}>
                  <p className="mb-1 text-sm text-[#9aadca]">
                    {message.author} • {message.time}
                  </p>
                  <div className={`inline-block max-w-[82%] rounded-3xl px-4 py-3 text-left text-lg ${isUser ? "bg-[#1b2748] text-white" : "bg-[#eff3f9] text-[#2f405d]"}`}>
                    {message.text}
                  </div>
                </div>
              );
            })}

            <div className="mb-2 mt-1">
              <div className="inline-flex rounded-3xl bg-[#eff3f9] px-4 py-3 text-[#8ea0bf]">●●●</div>
            </div>
          </div>

          <footer className="border-t border-[#e5ebf5] bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <button className="text-[#8ea0bf]" type="button">
                <Paperclip className="h-5 w-5" />
              </button>
              <input
                className="h-11 flex-1 rounded-full bg-[#f2f5fb] px-4 text-sm text-[#2f405d] outline-none placeholder:text-[#98a8c2]"
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    sendChatMessage();
                  }
                }}
                placeholder="Type a message..."
                type="text"
                value={chatInput}
              />
              <button
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#1b2748] text-white shadow-[0_10px_25px_-12px_rgba(12,26,58,0.9)]"
                onClick={sendChatMessage}
                type="button"
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-[#9cadc8]">Powered by SupportFlow</p>
          </footer>
        </aside>
      ) : null}
    </>
  );
}
