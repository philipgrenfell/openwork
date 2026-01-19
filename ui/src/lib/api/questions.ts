import { get, post } from './client'
import type { QuestionRequest, QuestionAnswer } from '@/types'

export async function getQuestions(options?: { directory?: string }): Promise<QuestionRequest[]> {
  return get<QuestionRequest[]>('/opencode/question', options)
}

export async function replyToQuestion(
  requestId: string,
  answers: QuestionAnswer[],
  options?: { directory?: string }
): Promise<boolean> {
  return post<boolean>(`/opencode/question/${encodeURIComponent(requestId)}/reply`, { answers }, options)
}
