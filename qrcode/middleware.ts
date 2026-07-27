import { NextResponse, type NextRequest } from "next/server";

// Auth is handled client-side via sessionStorage.
// This middleware only prevents the browser from caching protected pages
// — it does NOT gate access (pages gate themselves on mount).
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = { matcher: [] };
