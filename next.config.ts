/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This allows ANY device on your local network to connect during dev
    allowedDevOrigins: ['192.168.1.41', '192.168.1.139', 'localhost:3000'],
  },
  // Disable HMR overlay if it keeps crashing on the 2nd PC
  devIndicators: {
    buildActivity: false,
  },
};

export default nextConfig;