const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
module.exports = withPWA({
  reactStrictMode: true,
  // 启用压缩
  compress: true,
  // 优化图片
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  // 实验性功能：优化包大小
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['leaflet', 'react-icons', 'lucide-react'],
  },
  // 优化webpack配置
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // 生产环境优化
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          leaflet: {
            test: /[\\/]node_modules[\\/]leaflet[\\/]/,
            name: 'leaflet',
            chunks: 'all',
            priority: 10,
          },
        },
      };
    }
    return config;
  },
}); 