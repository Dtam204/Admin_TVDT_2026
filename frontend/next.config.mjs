/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Output standalone for Docker
  output: 'standalone',
  
  // Performance optimizations
  compress: true,
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'sfb.vn',
      },
      // Allow localhost for development
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      // Allow all subdomains of sfb.vn
      {
        protocol: 'https',
        hostname: '**.sfb.vn',
      },
      {
        protocol: 'http',
        hostname: '**.sfb.vn',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 85], // Hỗ trợ cả quality 75 và 85
  },
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  // Rewrite API requests to backend (optional - for same domain deployment)
  // Uncomment if you want to use Next.js rewrites instead of Nginx
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/v1/:path*',
  //       destination: process.env.API_SFB_URL 
  //         ? `${process.env.API_SFB_URL}/api/:path*`
  //         : 'http://localhost:4000/api/:path*',
  //     },
  //   ];
  // },
};

export default nextConfig;


