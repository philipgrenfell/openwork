import { useState, useCallback, useEffect } from 'react'
import { getMessages, sendMessage, abortSession } from '@/lib/api/sessions'
import type { Message, Step, AgentMode, MessagePart, ToolPart, ModelRef } from '@/types'

function stripCode(text: string) {
  const withoutFences = text.replace(/```[\s\S]*?```/g, '')
  const withoutInline = withoutFences.replace(/`[^`]*`/g, '')
  const withoutIndented = withoutInline
    .split('\n')
    .filter((line) => !/^( {4}|\t)/.test(line))
    .join('\n')
  return withoutIndented.replace(/\n{3,}/g, '\n\n').trim()
}

function getToolStatus(parts: MessagePart[]) {
  const toolParts = parts.filter((part): part is ToolPart => part.type === 'tool')
  if (toolParts.some(part => part.state.status === 'running' || part.state.status === 'pending')) {
    return 'running'
  }
  if (toolParts.some(part => part.state.status === 'error')) {
    return 'failed'
  }
  return 'success'
}

function getToolTitle(parts: MessagePart[]) {
  const hasText = parts.some((part) => part.type === 'text' && part.text?.trim())
  if (hasText) return 'Assistant'
  const toolPart = parts.find((part): part is ToolPart => part.type === 'tool')
  return toolPart?.tool || 'Response'
}

function getToolDetail(parts: MessagePart[]) {
  const toolPart = parts.find((part): part is ToolPart => part.type === 'tool')
  if (!toolPart) return ''
  if (toolPart.state.status !== 'completed') return ''
  if (!toolPart.state.output) return ''
  return stripCode(toolPart.state.output)
}

function getToolRaw(parts: MessagePart[]) {
  const toolPart = parts.find((part): part is ToolPart => part.type === 'tool')
  if (!toolPart) return ''
  if (toolPart.state.status !== 'completed') return ''
  return toolPart.state.output || ''
}

function getMessageDetail(parts: MessagePart[]) {
  const text = parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text || '')
    .join('\n\n')
  return stripCode(text)
}

function getMessageRaw(parts: MessagePart[]) {
  return parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text || '')
    .join('\n\n')
    .trim()
}

// Convert messages to steps (one step per assistant message)
function messagesToSteps(messages: Message[]): Step[] {
  return messages
    .filter((m) => m.info.role === 'assistant' || m.info.role === 'user')
    .filter((m) => {
      if (m.info.role !== 'assistant') return true
      const tool = m.parts.find((part): part is ToolPart => part.type === 'tool')?.tool
      return tool !== 'todowrite'
    })
    .map((m, index) => {
      const assistantMessages = messages.filter((msg) => msg.info.role === 'assistant')
      const isLast =
        m.info.role === 'assistant' &&
        index === messages.findIndex((msg) => msg.info.id === assistantMessages.at(-1)?.info.id)
      const status = getToolStatus(m.parts)
      const isRunning = isLast && status === 'running'
      
      const rawDetail = m.info.role === 'user'
        ? getMessageRaw(m.parts)
        : getMessageRaw(m.parts) || getToolRaw(m.parts)
      const detail = m.info.role === 'user'
        ? getMessageDetail(m.parts)
        : getMessageDetail(m.parts) || getToolDetail(m.parts)

      return {
        id: m.info.id,
        title: m.info.role === 'user' ? 'You' : getToolTitle(m.parts),
        detail,
        rawDetail: rawDetail || undefined,
        status: m.info.role === 'user' ? 'success' : (isRunning ? 'running' : status),
      } as Step
    })
}

export function useMessages(sessionId: string | null, directory?: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchMessages = useCallback(async () => {
    if (!sessionId) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await getMessages(sessionId, 50, { directory })
      setMessages(data)
      setSteps(messagesToSteps(data))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages')
    } finally {
      setLoading(false)
    }
  }, [sessionId, directory])

  useEffect(() => {
    if (!sessionId) return
    const hasRunning = messages.some((message) =>
      message.parts.some(
        (part) =>
          part.type === 'tool' &&
          (part.state.status === 'running' || part.state.status === 'pending')
      )
    )
    if (!sending && !hasRunning) return
    const interval = window.setInterval(() => {
      fetchMessages()
    }, 1500)
    return () => window.clearInterval(interval)
  }, [sessionId, messages, sending, fetchMessages])
  
  const send = useCallback(async (text: string, agent: AgentMode = 'build', model?: ModelRef) => {
    if (!sessionId || !text.trim()) return
    
    try {
      setSending(true)
      setError(null)
      
      // Add optimistic step
      setSteps(prev => [...prev, {
        id: `temp-${Date.now()}`,
        title: agent === 'plan' ? 'Planning' : 'Building',
        detail: text,
        status: 'running',
      }])
      
      const response = await sendMessage(sessionId, text, agent, model, { directory })
      
      // Refresh messages to get the full response
      await fetchMessages()
      
      return response
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      // Remove optimistic step on error
      setSteps(prev => prev.filter(s => !s.id.startsWith('temp-')))
      throw err
    } finally {
      setSending(false)
    }
  }, [sessionId, directory, fetchMessages])
  
  const abort = useCallback(async () => {
    if (!sessionId) return
    
    try {
      await abortSession(sessionId, { directory })
      await fetchMessages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to abort')
    }
  }, [sessionId, directory, fetchMessages])
  
  return {
    messages,
    steps,
    loading,
    sending,
    error,
    refresh: fetchMessages,
    send,
    abort,
  }
}
