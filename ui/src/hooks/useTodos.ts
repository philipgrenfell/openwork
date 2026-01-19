import { useCallback, useEffect, useState } from 'react'

import { getTodos } from '@/lib/api/todos'
import type { TodoItem } from '@/types'

export function useTodos(sessionId: string | null, directory?: string) {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!sessionId) {
      setTodos([])
      setError(null)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const data = await getTodos(sessionId, { directory })
      setTodos(data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load todos')
    } finally {
      setLoading(false)
    }
  }, [sessionId, directory])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    todos,
    loading,
    error,
    refresh,
    setTodos,
  }
}
