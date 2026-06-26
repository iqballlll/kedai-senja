export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxtjs/supabase'
  ],
  runtimeConfig: {
    geminiApiKey: process.env.GEMINI_API_KEY 
  },
  devtools: {
    enabled: true
  },
  css: ['~/assets/css/main.css'],
  routeRules: {
   '/': { redirect: '/login' }
  },
  compatibilityDate: '2025-01-15',
  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },
  supabase: {
    redirect: false
  }
})