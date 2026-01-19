import { useCallback, useEffect, useState } from 'react'

import { listWorkspaceFiles } from '@/lib/api/workspace'

export function useWorkspaceFiles(directory?: string, refreshKey?: number) {
  const [files, setFiles] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!directory) {
      setFiles([])
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await listWorkspaceFiles({ directory })
      setFiles(response.files)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load workspace files'
      setError(message)
      setFiles([])
    } finally {
      setLoading(false)
    }
  }, [directory])

  useEffect(() => {
    refresh()
  }, [refresh, refreshKey])

  return { files, loading, error, refresh }
}
