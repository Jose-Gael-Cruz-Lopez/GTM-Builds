import { apiFetch } from '../api-client'

export interface GenerateTokenRequest {
  businessId: string
}

export interface GenerateTokenResponse {
  token: string
  expiresAt: string
  ttlSeconds: number
}

export const tokensApi = {
  generate: (body: GenerateTokenRequest) =>
    apiFetch<GenerateTokenResponse>('/tokens/generate', {
      method: 'POST',
      body,
    }),
}
