import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },

  // 本番最適化
  reactStrictMode: true,

  // 画像最適化
  images: {
    domains: [
      "lh3.googleusercontent.com",     // Google OAuth
      "avatars.githubusercontent.com", // GitHub OAuth
      "img.clerk.com",                 // Clerk
      "profile.line-scdn.net",         // LINE
    ],
    formats: ["image/avif", "image/webp"],
  },

  // 外部パッケージの最適化
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "date-fns",
    ],
  },
};

export default nextConfig;
