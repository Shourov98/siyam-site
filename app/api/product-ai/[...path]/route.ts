import { NextRequest, NextResponse } from "next/server";

const DEFAULT_BACKEND_BASE_URL = "http://127.0.0.1:8000/api";
const DEFAULT_PROXY_TIMEOUT_MS = 10 * 60 * 1000;

export const runtime = "nodejs";

function getBackendBaseUrl() {
  return process.env.PRODUCT_AI_AGENT_BASE_URL ?? DEFAULT_BACKEND_BASE_URL;
}

function getProxyTimeoutMs() {
  const raw = Number.parseInt(process.env.PRODUCT_AI_AGENT_PROXY_TIMEOUT_MS ?? "", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_PROXY_TIMEOUT_MS;
}

async function forwardRequest(request: NextRequest, pathSegments: string[]) {
  const backendBaseUrl = getBackendBaseUrl();
  const upstreamUrl = new URL(`${backendBaseUrl.replace(/\/$/, "")}/${pathSegments.join("/")}`);
  const timeoutMs = getProxyTimeoutMs();

  request.nextUrl.searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.set(key, value);
  });

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
    signal: AbortSignal.timeout(timeoutMs),
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, init);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Product AI backend request failed.";
    const isTimeout =
      message.includes("Headers Timeout") ||
      message.includes("Body Timeout") ||
      message.includes("timed out") ||
      message.includes("fetch failed");

    return NextResponse.json(
      {
        detail: isTimeout
          ? `Product AI backend timed out after ${Math.round(timeoutMs / 1000)} seconds.`
          : `Product AI backend request failed: ${message}`,
      },
      { status: isTimeout ? 504 : 502 },
    );
  }

  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forwardRequest(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forwardRequest(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forwardRequest(request, path);
}
