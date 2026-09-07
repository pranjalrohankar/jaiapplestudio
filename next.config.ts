import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Placeholder product images are hotlinked from Apple's public CDN.
    // `unoptimized` avoids fetching/optimising them at build time, which
    // keeps Netlify deployments fast and offline builds reliable.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "www.apple.com", pathname: "/**" },
      { protocol: "https", hostname: "images.apple.com", pathname: "/**" },
      { protocol: "https", hostname: "store.storeimages.cdn-apple.com", pathname: "/**" },
      { protocol: "https", hostname: "store.apple.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;