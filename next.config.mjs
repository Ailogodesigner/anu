/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["cdn.discordapp.com", "images.unsplash.com"],
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "discord.js"],
  },
};

export default nextConfig;
