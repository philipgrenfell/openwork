import { useCallback, useEffect, useMemo, useState } from 'react'

import { getQuestions, replyToQuestion } from '@/lib/api/questions'
import type { QuestionAnswer, QuestionRequest } from '@/types'

export function useQuestions(sessionId: string | null, directory?: string) {
  const [requests, setRequests] = useState<QuestionRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getQuestions({ directory })
      setRequests(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions')
    } finally {
      setLoading(false)
    }
  }, [directory])

  const reply = useCallback(
    async (requestId: string, answers: QuestionAnswer[]) => {
      await replyToQuestion(requestId, answers, { directory })
      setRequests((prev) => prev.filter((request) => request.id !== requestId))
    },
    [directory]
  )

  useEffect(() => {
    refresh()
  }, [refresh])

  const questions = useMemo(() => {
    if (!sessionId) return []
    return requests.filter((request) => request.sessionID === sessionId)
  }, [requests, sessionId])

  return {
    questions,
    loading,
    error,
    refresh,
    reply,
  }
}
