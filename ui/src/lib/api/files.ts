import { get } from './client'
import type { FileStatus } from '@/types'

export async function getFileStatus(options?: { directory?: string }): Promise<FileStatus[]> {
  return get<FileStatus[]>('/opencode/file/status', options)
}

export async function getFileContent(
  path: string,
  options?: { directory?: string }
): Promise<{ type: string; content: string }> {
  return get<{ type: string; content: string }>(`/opencode/file/content?path=${encodeURIComponent(path)}`, options)
}
