import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { env, config } from "@/lib/env";

// Security headers configuration
const securityHeaders = {
  // Prevent clickjacking
  "X-Frame-Options": "DENY",
  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",
  // Enable XSS protection
  "X-XSS-Protection": "1; mode=block",
  // Control referrer information
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Permissions policy
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  // DNS prefetch control
  "X-DNS-Prefetch-Control": "on",
};

// Production-only headers
const productionHeaders = {
  // Strict transport security (HSTS)
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  // Content Security Policy
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self'",
    "connect-src 'self' https://vercel.live wss://ws.vercel.live",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};

// CORS configuration
function setCorsHeaders(response: NextResponse, origin: string | null) {
  const allowedOrigins = config.cors.allowedOrigins;
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
    );
  }
  
  return response;
}

// Rate limiting check (basic implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  if (config.rateLimit.enabled === false) {
    return true;
  }
  
  const now = Date.now();
  const limit = requestCounts.get(ip);
  
  if (!limit || now > limit.resetTime) {
    requestCounts.set(ip, {
      count: 1,
      resetTime: now + config.rateLimit.windowMs,
    });
    return true;
  }
  
  if (limit.count >= config.rateLimit.maxRequests) {
    return false;
  }
  
  limit.count++;
  return true;
}

// Main middleware function
export default withAuth(
  async function middleware(req: NextRequest) {
    const response = NextResponse.next();
    const token = (req as any).nextauth?.token;
    const path = req.nextUrl.pathname;
    const origin = req.headers.get("origin");
    const ip = req.ip || req.headers.get("x-forwarded-for") || "unknown";
    
    // Apply security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Apply production-only headers
    if (env.NODE_ENV === "production") {
      Object.entries(productionHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }
    
    // Handle CORS for API routes
    if (path.startsWith("/api/")) {
      setCorsHeaders(response, origin);
      
      // Handle preflight requests
      if (req.method === "OPTIONS") {
        return new Response(null, { status: 200, headers: response.headers });
      }
      
      // Check rate limiting for API routes
      if (!checkRateLimit(ip)) {
        return new Response("Too Many Requests", {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(config.rateLimit.windowMs / 1000)),
          },
        });
      }
    }
    
    // Admin routes protection
    if (path.startsWith("/admin")) {
      if (!token || token.role !== "admin") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }
    
    // Protected routes for authenticated users
    if (path.startsWith("/dashboard") || path.startsWith("/profile") || path.startsWith("/manage")) {
      if (!token) {
        const url = new URL("/auth/login", req.url);
        url.searchParams.set("callbackUrl", req.url);
        return NextResponse.redirect(url);
      }
    }
    
    // Add request ID for tracking
    response.headers.set("X-Request-ID", crypto.randomUUID());
    
    return response;
  },
  {
    callbacks: {
      authorized: () => true, // Let the middleware function handle authorization
    },
  }
);

// Update matcher configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt (static files)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|public).*)",
  ],
};

// Cleanup old rate limit entries periodically
if (typeof globalThis.setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, limit] of requestCounts.entries()) {
      if (now > limit.resetTime) {
        requestCounts.delete(ip);
      }
    }
  }, 60000); // Clean up every minute
}