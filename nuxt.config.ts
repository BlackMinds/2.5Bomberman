export default defineNuxtConfig({
  devtools: { enabled: false },
  ssr: false,
  // modules: ['@vite-pwa/nuxt'], // disabled: causes rollupOptions.input error in dev

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET,
    databaseUrl: process.env.DATABASE_URL,
    public: {
      socketServerUrl: process.env.SOCKET_SERVER_URL || 'http://localhost:3001',
    },
  },

  vite: {
    optimizeDeps: { include: ['phaser'] },
  },
})
