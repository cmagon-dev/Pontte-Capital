/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Melhorias para prevenir problemas de cache e hot-reload
  webpack: (config, { dev, isServer }) => {
    // Garantir que Prisma Client não seja incluído no bundle do cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        perf_hooks: false,
        canvas: false,
      };
      // Excluir Prisma Client e pg do bundle do cliente
      config.externals = config.externals || [];
      config.externals.push({
        '@prisma/client': 'commonjs @prisma/client',
        'pg': 'commonjs pg',
        '@prisma/adapter-pg': 'commonjs @prisma/adapter-pg',
      });
    }
    
    // Em desenvolvimento, melhorar o hot-reload
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000, // Verifica mudanças a cada 1 segundo
        aggregateTimeout: 300, // Aguarda 300ms antes de recompilar
        ignored: /node_modules/,
      };
    }
    return config;
  },
  // Configurações de compilação mais robustas
  onDemandEntries: {
    // Mantém páginas em memória por mais tempo em dev
    maxInactiveAge: 60 * 1000, // 60 segundos
    pagesBufferLength: 5, // Mantém 5 páginas em buffer
  },
};

module.exports = nextConfig;
