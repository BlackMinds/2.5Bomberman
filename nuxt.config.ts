export default defineNuxtConfig({
  devtools: { enabled: false },
  ssr: false,
  modules: ['@vite-pwa/nuxt'],

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET,
    databaseUrl: process.env.DATABASE_URL,
    public: {
      socketServerUrl: process.env.SOCKET_SERVER_URL || 'http://localhost:3001',
    },
  },

  pwa: {
    manifest: {
      name: 'BomberVerse',
      short_name: 'Bomber',
      display: 'standalone',
      orientation: 'landscape',
      theme_color: '#1a1a2e',
    },
  },

  vite: {
    optimizeDeps: { include: ['phaser'] },
  },
})
