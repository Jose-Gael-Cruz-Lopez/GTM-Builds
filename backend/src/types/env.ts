export interface Env {
  // KV Namespaces
  TOKEN_BLACKLIST: KVNamespace;
  RATE_LIMIT: KVNamespace;
  ANALYTICS_CACHE: KVNamespace;

  // Secrets (set via: wrangler secret put SECRET_NAME)
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY: string;
  TOKEN_SECRET: string;       // 256-bit hex string used for HMAC
  NIM_API_KEY: string;        // NVIDIA NIM API key (integrate.api.nvidia.com)
  STAFF_API_KEY_HASH: string; // SHA-256 hex hash of the raw staff API key

  // Configurable vars
  FRONTEND_ORIGIN: string;
  TOKEN_TTL_SECONDS: string;
  RATE_LIMIT_WINDOW_SECONDS: string;
  RATE_LIMIT_MAX_REQUESTS: string;
}
