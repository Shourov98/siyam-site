import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

const DEFAULT_OUTPUT_ROOT = path.resolve(process.cwd(), "../product-ai-agent/output");

function getAllowedRoot() {
  return path.resolve(process.env.PRODUCT_AI_AGENT_OUTPUT_ROOT ?? DEFAULT_OUTPUT_ROOT);
}

function resolveRequestedPath(rawPath: string, allowedRoot: string) {
  if (path.isAbsolute(rawPath)) {
    return path.resolve(rawPath);
  }

  return path.resolve(allowedRoot, "..", rawPath);
}

function getMimeType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  if (extension === ".gif") return "image/gif";
  return "application/octet-stream";
}

export async function GET(request: NextRequest) {
  const rawPath = request.nextUrl.searchParams.get("path");

  if (!rawPath) {
    return NextResponse.json({ detail: "Missing image path." }, { status: 400 });
  }

  const allowedRoot = getAllowedRoot();
  const resolvedPath = resolveRequestedPath(rawPath, allowedRoot);

  if (!resolvedPath.startsWith(allowedRoot)) {
    return NextResponse.json({ detail: "Image path is outside the allowed output directory." }, { status: 403 });
  }

  try {
    const payload = await readFile(resolvedPath);
    return new NextResponse(payload, {
      status: 200,
      headers: {
        "Content-Type": getMimeType(resolvedPath),
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ detail: "Image file was not found." }, { status: 404 });
  }
}
