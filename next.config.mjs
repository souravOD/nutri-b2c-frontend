// next.config.mjs

// Prefer NEXT_PUBLIC_API_BASE_URL (so the same value is available in the browser if needed),
// then NEXT_PUBLIC_API_BASE, then API_BASE_URL. If a hostname is provided without scheme,
// normalize to https:// (Vercel requires destination to start with http/https or /).
const RAW_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.API_BASE_URL ||
  ""
).trim();

const API_BASE = (
  RAW_BASE
    ? (/^https?:\/\//i.test(RAW_BASE) ? RAW_BASE : `https://${RAW_BASE}`)
    : "http://127.0.0.1:5000"
).replace(/\/+$/, "");

// Vercel sets VERCEL=1 in build/runtime environments.
// Keep local builds strict by default, but skip lint during Vercel builds.
const IS_VERCEL = process.env.VERCEL === "1";

import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Produce a self-contained build for Docker (much smaller image — no bulky node_modules)
  output: "standalone",

  // Allow external recipe images from any HTTPS source.
  // Recipe images come from 50+ domains (pinimg, sndimg, nyt, allrecipes,
  // squarespace-cdn, apartmenttherapy, amazonaws, etc.), so a broad HTTPS
  // pattern is necessary. HTTP is blocked to prevent mixed-content issues.
  // SEC-02: Wildcard HTTPS is required — recipe images come from 50+ CDN domains.
  // Block SVG to prevent SSRF via /_next/image proxy.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
  },

  // Proxy API calls to the backend; destinations are baked at build time
  // into .next/routes-manifest.json (NOT re-evaluated at runtime by `next start`).
  // In Docker: API_BASE_URL=http://backend:5000 via build arg.
  // Locally:   falls back to http://127.0.0.1:5000 (see API_BASE above).
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${API_BASE}/api/v1/:path*` },
    ];
  },

  // Increase proxy timeout for long-running endpoints (e.g. meal plan generation
  // which calls the LLM and can take 30–60 seconds). Default ~30s causes ECONNRESET.
  experimental: {
    proxyTimeout: 120_000,   // 120 seconds — covers RAG + LLM + DB round-trip
  },

  // Keep the HTTP agent alive so long-running proxied requests don't get dropped
  httpAgentOptions: {
    keepAliveMsecs: 10_000,
  },

  // Keep TS checks enabled, but don't block Vercel deploys on existing lint debt.
  eslint: { ignoreDuringBuilds: IS_VERCEL },
  typescript: { ignoreBuildErrors: false },
  webpack(config) {
    // Ensure '@' alias works in all environments (CI/build included)
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
};

export default nextConfig;
