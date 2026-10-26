/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["cdn.discordapp.com", "images.unsplash.com"],
  },
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ["@prisma/client", "discord.js"],
  },
};

export default nextConfig;
