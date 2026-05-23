import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config'

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
        miniflare: {
          kvNamespaces: ['TOKEN_BLACKLIST', 'RATE_LIMIT', 'ANALYTICS_CACHE'],
          bindings: {
            SUPABASE_URL: 'https://test.supabase.co',
            SUPABASE_ANON_KEY: 'test-anon-key',
            SUPABASE_SERVICE_KEY: 'test-service-key',
            TOKEN_SECRET: 'a'.repeat(64),
            NIM_API_KEY: 'test-nim-key',
            STAFF_API_KEY_HASH: 'test-hash',
            FRONTEND_ORIGIN: 'http://localhost:5173',
            TOKEN_TTL_SECONDS: '90',
            RATE_LIMIT_WINDOW_SECONDS: '60',
            RATE_LIMIT_MAX_REQUESTS: '60',
          },
        },
      },
    },
  },
})
