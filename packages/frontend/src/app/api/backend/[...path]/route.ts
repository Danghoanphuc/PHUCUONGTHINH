import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001/api/v1";

function buildHeaders(
  request: NextRequest,
  contentType?: string,
): Record<string, string> {
  const headers: Record<string, string> = {};
  const auth = request.headers.get("authorization");
  if (auth) headers["authorization"] = auth;
  if (contentType) headers["Content-Type"] = contentType;
  return headers;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const path = params.path.join("/");
  const search = request.nextUrl.search;
  const url = `${BACKEND_URL}/${path}${search}`;
  const res = await fetch(url, {
    headers: buildHeaders(request, "application/json"),
    cache: "no-store",
  });
  const data = await res.json();

  // Add cache control headers to prevent browser caching
  return NextResponse.json(data, {
    status: res.status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const path = params.path.join("/");
  const url = `${BACKEND_URL}/${path}`;
  const contentType = request.headers.get("content-type") ?? "";

  // Multipart: forward body as-is, don't touch Content-Type (browser sets boundary)
  if (contentType.includes("multipart/form-data")) {
    const body = await request.arrayBuffer();
    const res = await fetch(url, {
      method: "POST",
      headers: { ...buildHeaders(request), "Content-Type": contentType },
      body,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  const body = await request.text();
  const res = await fetch(url, {
    method: "POST",
    headers: buildHeaders(request, "application/json"),
    body,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const path = params.path.join("/");
  const url = `${BACKEND_URL}/${path}`;
  const body = await request.text();
  const res = await fetch(url, {
    method: "PUT",
    headers: buildHeaders(request, "application/json"),
    body,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const path = params.path.join("/");
  const url = `${BACKEND_URL}/${path}`;
  const body = await request.text();
  const res = await fetch(url, {
    method: "PATCH",
    headers: buildHeaders(request, "application/json"),
    body,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const path = params.path.join("/");
  const url = `${BACKEND_URL}/${path}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: buildHeaders(request, "application/json"),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
