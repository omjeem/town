import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@town/types", "@town/db"],
  // @napi-rs/canvas ships its platform-specific binary as a separate
  // optional dependency (skia.darwin-arm64.node, etc.). Next's bundler
  // tries to resolve those eagerly and chokes; marking the package
  // external keeps the require() at runtime, where pnpm has the right
  // binding on disk.
  serverExternalPackages: ["@napi-rs/canvas"],
};

export default nextConfig;
