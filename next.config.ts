import type { NextConfig } from "next";

export const SECURITY_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self'",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self'",
  "media-src 'self'",
  "frame-src 'none'",
  "worker-src 'self'",
].join("; ");

export const SECURITY_PERMISSIONS_POLICY = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "payment=()",
  "usb=()",
  "serial=()",
  "bluetooth=()",
  "accelerometer=()",
  "gyroscope=()",
  "magnetometer=()",
  "display-capture=()",
  "clipboard-write=(self)",
].join(", ");

export const GLOBAL_SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: SECURITY_PERMISSIONS_POLICY },
  {
    key: "Content-Security-Policy",
    value: SECURITY_CSP,
  },
] as const;

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...GLOBAL_SECURITY_HEADERS],
      },
    ];
  },
};

export default nextConfig;
