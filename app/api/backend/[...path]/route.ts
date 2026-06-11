import { NextResponse } from "next/server";

import {
  clearCookiesOnResponse,
  getAuthTokensFromCookies,
  refreshAccessToken,
  setCookiesOnResponse,
} from "@/lib/server/auth-session";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "cookie",
  "host",
  "transfer-encoding",
]);

const RESPONSE_HEADERS_TO_STRIP = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding",
]);

async function proxyRequest(request: Request, params: Promise<{ path: string[] }>) {
  const { path } = await params;
  const pathname = `/${path.join("/")}`;
  const search = new URL(request.url).search;
  const body =
    request.method === "GET" || request.method === "HEAD" ? undefined : Buffer.from(await request.arrayBuffer());
  const tokens = await getAuthTokensFromCookies();
  if (!tokens.accessToken && !tokens.refreshToken) {
    const unauthorized = NextResponse.json(
      {
        success: false,
        message: "Authentication is required.",
      },
      { status: 401 },
    );
    clearCookiesOnResponse(unauthorized);
    return unauthorized;
  }

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  const targetUrl = `${(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api/v1")}${pathname}${search}`;
  try {
    const apiUrl = new URL(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api/v1");
    if (apiUrl.hostname.includes("ngrok")) {
      headers.set("ngrok-skip-browser-warning", "true");
    }
  } catch {
    // Ignore invalid env parsing and fall back to current headers.
  }
  let accessToken = tokens.accessToken;

  const sendUpstream = (token: string | null) => {
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    } else {
      headers.delete("Authorization");
    }

    return fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });
  };

  let upstream = await sendUpstream(accessToken);
  let refreshed = false;

  if (upstream.status === 401 && tokens.refreshToken) {
    const nextAccessToken = await refreshAccessToken(tokens.refreshToken);
    if (nextAccessToken) {
      accessToken = nextAccessToken;
      upstream = await sendUpstream(accessToken);
      refreshed = true;
    }
  }

  const responseHeaders = new Headers(upstream.headers);
  for (const headerName of RESPONSE_HEADERS_TO_STRIP) {
    responseHeaders.delete(headerName);
  }

  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });

  if (refreshed && accessToken) {
    setCookiesOnResponse(response, { accessToken });
  }

  if (upstream.status === 401) {
    clearCookiesOnResponse(response);
  }

  return response;
}

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context.params);
}

export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context.params);
}

export async function PUT(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context.params);
}

export async function PATCH(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context.params);
}

export async function DELETE(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context.params);
}
