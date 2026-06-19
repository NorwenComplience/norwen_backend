export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  router: {
    options: {
      middleware: ['auth'],
    },
  },
})
