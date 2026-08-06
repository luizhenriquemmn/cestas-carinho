import { NextRequest, NextResponse } from "next/server";

function allowedOrigin(origin: string | null) {
  if (!origin) return null;

  if (origin === process.env.ADMIN_APP_ORIGIN) return origin;

  try {
    const url = new URL(origin);
    const localHost =
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname.startsWith("192.168.") ||
      url.hostname.startsWith("10.");

    return url.protocol === "http:" && url.port === "8081" && localHost
      ? origin
      : null;
  } catch {
    return null;
  }
}

function applyCors(response: NextResponse, origin: string | null) {
  const allowed = allowedOrigin(origin);
  if (allowed) {
    response.headers.set("Access-Control-Allow-Origin", allowed);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    response.headers.set("Access-Control-Max-Age", "86400");
    response.headers.append("Vary", "Origin");
  }
  return response;
}

export function proxy(request: NextRequest) {
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("origin");
    if (!allowedOrigin(origin)) {
      return new NextResponse(null, { status: 403 });
    }
    return applyCors(new NextResponse(null, { status: 204 }), origin);
  }

  return applyCors(NextResponse.next(), request.headers.get("origin"));
}

export const config = {
  matcher: "/api/:path*",
};
