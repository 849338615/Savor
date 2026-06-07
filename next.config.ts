import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Keep dynamic page segments in the client router cache for 5 minutes so
    // returning to a page reuses its already-rendered result instead of
    // re-fetching. Without this (the default is 0s = never cached), leaving
    // `/results` for another tab and coming back via Home re-runs the whole
    // search and flashes the loading skeletons. 5 min mirrors the server-side
    // search cache (SEARCH_CACHE in extraction/index.ts), so a return inside
    // that window is instant and lands exactly where the user left off.
    //
    // Safe for the rest of the app: /saved and /profile are client components
    // driven by live stores (so their data isn't staled by this), and
    // /results + /recipe are read-mostly. New searches use a different URL and
    // are unaffected — they still fetch fresh.
    staleTimes: {
      dynamic: 300,
    },
  },
};

export default nextConfig;
