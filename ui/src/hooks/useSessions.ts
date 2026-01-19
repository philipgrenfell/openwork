import { useState, useEffect, useCallback } from 'react'
import { getSessions, createSession, deleteSession, updateSession } from '@/lib/api/sessions'
import type { Session, Task } from '@/types'
import { sessionToTask } from '@/types'

export function useSessions(directory?: string) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const tasks: Task[] = sessions.map(sessionToTask).sort((a, b) => b.updated - a.updated)
  
  const fetchSessions = useCallback(async () => {
    try {
      setError(null)
      const data = await getSessions({ directory })
      setSessions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions')
    } finally {
      setLoading(false)
    }
  }, [directory])
  
  const create = useCallback(async (title?: string, options?: { directory?: string }) => {
    try {
      const session = await createSession(title, options)
      setSessions(prev => [session, ...prev])
      return session
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session')
      throw err
    }
  }, [])
  
  const remove = useCallback(async (id: string, options?: { directory?: string }) => {
    try {
      await deleteSession(id, options)
      setSessions(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session')
      throw err
    }
  }, [])
  
  const update = useCallback(async (id: string, title: string, options?: { directory?: string }) => {
    try {
      const session = await updateSession(id, title, options)
      setSessions(prev => prev.map(s => s.id === id ? session : s))
      return session
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update session')
      throw err
    }
  }, [])
  
  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])
  
  return {
    sessions,
    tasks,
    loading,
    error,
    refresh: fetchSessions,
    create,
    remove,
    update,
  }
}
