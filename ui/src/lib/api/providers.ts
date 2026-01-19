import { get } from './client'
import type { ProvidersResponse } from '@/types'

export async function getProviders(options?: { directory?: string }): Promise<ProvidersResponse> {
  return get<ProvidersResponse>('/opencode/config/providers', options)
}
