import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { env, config as appConfig } from "./lib/env-validation";
import { getToken } from "next-auth/jwt";

// Extend NextRequest to include ip property
interface NextRequestWithIP extends NextRequest {
  ip?: string;
}

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
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://vercel.live wss://ws.vercel.live https://fonts.googleapis.com https://fonts.gstatic.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};

// CORS configuration
function setCorsHeaders(response: NextResponse, origin: string | null) {
  const allowedOrigins = appConfig.cors.allowedOrigins;
  
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
  if (appConfig.rateLimit.enabled === false) {
    return true;
  }
  
  const now = Date.now();
  const limit = requestCounts.get(ip);
  
  if (!limit || now > limit.resetTime) {
    requestCounts.set(ip, {
      count: 1,
      resetTime: now + appConfig.rateLimit.windowMs,
    });
    return true;
  }
  
  if (limit.count >= appConfig.rateLimit.maxRequests) {
    return false;
  }
  
  limit.count++;
  return true;
}

// Helper function to get client IP
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIP = req.headers.get("x-real-ip");
  const remoteAddr = req.headers.get("x-forwarded-host");
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP.trim();
  }
  if (remoteAddr) {
    return remoteAddr.trim();
  }
  return "unknown";
}

// Main middleware function
export default async function middleware(req: NextRequestWithIP) {
  const response = NextResponse.next();
  const path = req.nextUrl.pathname;
  const origin = req.headers.get("origin");
  const ip = getClientIP(req);
  const method = req.method;
  
  // Get the auth token using next-auth/jwt
  const token = await getToken({ 
    req, 
    secret: env.NEXTAUTH_SECRET 
  });
  
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
    if (method === "OPTIONS") {
      return new Response(null, { status: 200, headers: response.headers });
    }
    
    // Check rate limiting for API routes
    if (!checkRateLimit(ip)) {
      return new Response("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(appConfig.rateLimit.windowMs / 1000)),
        },
      });
    }
    
    // Protect API mutations (POST, PUT, DELETE) - require authentication
    // GET requests are allowed without authentication for public browsing
    // Exclude auth endpoints and invitation validation from authentication requirements
    const publicApiPaths = [
      "/api/auth/",
      "/api/invitations/validate",
      "/api/health"
    ];
    
    const isPublicApi = publicApiPaths.some(publicPath => path.startsWith(publicPath));
    const isMutation = method === "POST" || method === "PUT" || method === "DELETE" || method === "PATCH";
    
    if (isMutation && !isPublicApi) {
      if (!token) {
        return new Response("Unauthorized", { status: 401 });
      }
    }
    
    // Admin API routes require admin role for all methods
    if (path.startsWith("/api/admin/")) {
      if (!token || token.role !== "admin") {
        return new Response("Forbidden", { status: 403 });
      }
    }
  }
  
  // Admin routes protection - still require admin role
  if (path.startsWith("/admin")) {
    if (!token || token.role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }
  
  // Authentication Strategy:
  // - All regular pages (courses, directory, people, etc.) are publicly accessible
  // - Admin routes (/admin/*) require admin role and redirect to /unauthorized
  // - API mutations (POST/PUT/DELETE) require authentication except for public endpoints
  // - Public API endpoints: auth routes, invitation validation, health checks
  // - No authentication redirects for regular pages - users can browse freely
  
  // Add request ID for tracking
  response.headers.set("X-Request-ID", crypto.randomUUID());
  
  return response;
}

// Middleware configuration for Next.js
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
    const entries = Array.from(requestCounts.entries());
    for (const [ip, limit] of entries) {
      if (now > limit.resetTime) {
        requestCounts.delete(ip);
      }
    }
  }, 60000); // Clean up every minute
}