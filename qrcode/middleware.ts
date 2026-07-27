import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  // /admin-login: redirect to /dev if already logged in
  if (request.nextUrl.pathname === "/admin-login") {
    if (user) {
      const dest = request.nextUrl.clone();
      dest.pathname = "/dev";
      dest.search = "";
      return NextResponse.redirect(dest);
    }
    return response;
  }

  // Legacy /staff-login: also redirect to /dev if logged in as admin
  if (request.nextUrl.pathname === "/staff-login") {
    if (user) {
      const dest = request.nextUrl.clone();
      dest.pathname = "/dev";
      dest.search = "";
      return NextResponse.redirect(dest);
    }
    return response;
  }

  // Admin-only routes: require Supabase Auth session
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin-login";
    loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

// /scan/* is intentionally NOT here — it uses PIN session only (sessionStorage)
export const config = {
  matcher: ["/admin-login", "/staff-login", "/dev/:path*", "/dashboard/:path*", "/club/:path*", "/reward/:path*"],
};
