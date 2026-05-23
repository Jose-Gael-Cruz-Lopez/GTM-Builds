/// <reference types="@cloudflare/vitest-pool-workers" />

import type { Env } from '../types/env'

declare module 'cloudflare:test' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface ProvidedEnv extends Env {}
}
