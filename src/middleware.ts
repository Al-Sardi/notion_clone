import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
export default authMiddleware({
  publicRoutes: ["/", "/sign-in(.*)", "/sign-up(.*)", "/api(.*)"],
  ignoredRoutes: ["/api/webhook(.*)"],
  afterAuth: async (auth, req) => {
    // Handle authenticated requests
    if (auth.userId) {
      const response = NextResponse.next();
      
      try {
        // Add Supabase token to request headers
        const supabaseToken = await auth.getToken({ template: "supabase" });
        if (supabaseToken) {
          response.headers.set('Authorization', `Bearer ${supabaseToken}`);
        }
        
        // Redirect authenticated users away from auth pages
        if (["/sign-in", "/sign-up"].includes(req.nextUrl.pathname)) {
          return NextResponse.redirect(new URL("/documents", req.url));
        }
        
        return response;
      } catch (error) {
        console.error('Error getting Supabase token:', error);
        return response;
      }
    }

    // Handle unauthenticated requests to protected routes
    if (!auth.isPublicRoute) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}; 