import { get, post, patch, del } from './client'
import type { Session, Message } from '@/types'

export async function getSessions(options?: { directory?: string }): Promise<Session[]> {
  return get<Session[]>('/opencode/session', options)
}

export async function getSession(id: string, options?: { directory?: string }): Promise<Session> {
  return get<Session>(`/opencode/session/${id}`, options)
}

export async function createSession(title?: string, options?: { directory?: string }): Promise<Session> {
  return post<Session>('/opencode/session', { title }, options)
}

export async function updateSession(id: string, title: string, options?: { directory?: string }): Promise<Session> {
  return patch<Session>(`/opencode/session/${id}`, { title }, options)
}

export async function deleteSession(id: string, options?: { directory?: string }): Promise<boolean> {
  return del<boolean>(`/opencode/session/${id}`, options)
}

export async function getMessages(
  sessionId: string,
  limit = 50,
  options?: { directory?: string }
): Promise<Message[]> {
  return get<Message[]>(`/opencode/session/${sessionId}/message?limit=${limit}`, options)
}

export async function sendMessage(
  sessionId: string,
  text: string,
  agent: 'plan' | 'build' = 'build',
  model?: { providerID: string; modelID: string },
  options?: { directory?: string }
): Promise<Message> {
  return post<Message>(`/opencode/session/${sessionId}/message`, {
    agent,
    ...(model ? { model } : {}),
    parts: [{ type: 'text', text }],
  }, options)
}

export async function abortSession(sessionId: string, options?: { directory?: string }): Promise<boolean> {
  return post<boolean>(`/opencode/session/${sessionId}/abort`, undefined, options)
}
