import { get } from './client'
import type { TodoItem } from '@/types'

export async function getTodos(
  sessionId: string,
  options?: { directory?: string }
): Promise<TodoItem[]> {
  return get<TodoItem[]>(`/opencode/session/${encodeURIComponent(sessionId)}/todo`, options)
}
