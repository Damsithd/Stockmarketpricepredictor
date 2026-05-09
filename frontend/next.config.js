/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL || "http://localhost:8000";
    return [
      {
        // Explicitly proxy only the predict endpoint so /api/auth goes to Next.js
        source: "/api/predict",
        destination: `${backendUrl}/api/predict`,
      },
    ];
  },
};

module.exports = nextConfig;
