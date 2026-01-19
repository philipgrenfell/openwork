import { useState, useEffect, useCallback } from 'react'
import { getHealth } from '@/lib/api/health'
import type { HealthStatus } from '@/types'

export function useOpenCodeConnection(pollInterval = 10000) {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  
  const isConnected = health?.opencode?.status === 'ok'
  const version = health?.opencode?.version
  
  const checkHealth = useCallback(async () => {
    try {
      const data = await getHealth()
      setHealth(data)
    } catch (error) {
      setHealth({
        bridge: { status: 'error', timestamp: new Date().toISOString() },
        opencode: { status: 'error', error: 'Bridge not reachable' },
      })
    } finally {
      setLoading(false)
    }
  }, [])
  
  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, pollInterval)
    return () => clearInterval(interval)
  }, [checkHealth, pollInterval])
  
  return {
    health,
    isConnected,
    version,
    loading,
    refresh: checkHealth,
  }
}
