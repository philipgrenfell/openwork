import { useMemo } from 'react'

import type { Message, TodoItem, ToolPart } from '@/types'

function extractTodosFromMessage(messages: Message[]) {
  const todos: TodoItem[] = []
  for (const message of messages) {
    for (const part of message.parts) {
      if (part.type !== 'tool') continue
      const toolPart = part as ToolPart
      if (toolPart.tool !== 'todowrite' && toolPart.tool !== 'todoread') continue
      if (toolPart.state.status !== 'completed') continue
      if (!toolPart.state.output) continue
      try {
        const parsed = JSON.parse(toolPart.state.output) as TodoItem[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          todos.splice(0, todos.length, ...parsed)
        }
      } catch {
        // Ignore parse errors
      }
    }
  }
  return todos
}

export function useMessageTodos(messages: Message[]) {
  return useMemo(() => extractTodosFromMessage(messages), [messages])
}
