import { get, post } from './client'

export interface WorkspaceRoot {
  root: string
}

export interface WorkspaceInfo {
  path: string
}

export interface WorkspaceImportFile {
  path: string
  content: string
  encoding?: string
}

export async function getWorkspaceRoot(): Promise<WorkspaceRoot> {
  return get<WorkspaceRoot>('/workspace')
}

export async function createWorkspace(name?: string): Promise<WorkspaceInfo> {
  return post<WorkspaceInfo>('/workspace', { name })
}

export async function importWorkspace(
  files: WorkspaceImportFile[],
  name?: string
): Promise<WorkspaceInfo & { files: number }> {
  return post<WorkspaceInfo & { files: number }>('/workspace/import', { name, files })
}

export async function attachWorkspace(path: string): Promise<WorkspaceInfo> {
  return post<WorkspaceInfo>('/workspace/attach', { path })
}

export async function listWorkspaceFiles(options?: {
  directory?: string
  maxDepth?: number
  limit?: number
}): Promise<{ files: string[] }> {
  const params = new URLSearchParams()
  if (typeof options?.maxDepth === 'number') {
    params.set('maxDepth', String(options.maxDepth))
  }
  if (typeof options?.limit === 'number') {
    params.set('limit', String(options.limit))
  }
  const query = params.toString()
  const path = query ? `/workspace/files?${query}` : '/workspace/files'
  return get<{ files: string[] }>(path, { directory: options?.directory })
}

export async function openWorkspaceFile(path: string, directory?: string): Promise<{ ok: true }> {
  return post<{ ok: true }>('/workspace/open', { path, directory })
}
