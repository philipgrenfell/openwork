import { get } from './client'
import type { HealthStatus } from '@/types'

export async function getHealth(): Promise<HealthStatus> {
  return get<HealthStatus>('/health')
}
