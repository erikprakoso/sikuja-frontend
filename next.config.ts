import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Anti-cache headers: memastikan browser HP selalu memeriksa versi terbaru
  // setelah deploy, tanpa perlu clear cache manual.
  async headers() {
    return [
      {
        // Semua halaman HTML & API routes — selalu revalidate
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
