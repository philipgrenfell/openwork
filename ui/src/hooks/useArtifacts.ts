import { useMemo } from 'react'
import type { Artifact, Message, ToolPart, FilePart } from '@/types'
import { getArtifactKind } from '@/types'

function toArtifact(path: string): Artifact {
  const name = path.split('/').pop() || path
  return {
    id: path,
    name,
    path,
    kind: getArtifactKind(path),
  }
}

function addArtifact(artifacts: Map<string, Artifact>, path: string) {
  if (!path) return
  if (artifacts.has(path)) return
  artifacts.set(path, toArtifact(path))
}

function collectPathsFromInput(input: Record<string, unknown>) {
  const results: string[] = []
  const filePath = input.filePath || input.filepath || input.path
  if (typeof filePath === 'string') {
    results.push(filePath)
  }
  const files = input.files
  if (Array.isArray(files)) {
    for (const file of files) {
      if (typeof file === 'string') results.push(file)
    }
  }
  return results
}

function getAttachments(part: ToolPart): FilePart[] {
  if (part.state.status !== 'completed') return []
  return part.state.attachments ?? []
}

function extractArtifacts(messages: Message[], filePaths?: string[]): Artifact[] {
  const artifacts = new Map<string, Artifact>()

  for (const message of messages) {
    for (const part of message.parts) {
      if (part.type === 'patch') {
        part.files.forEach((file) => addArtifact(artifacts, file))
      }

      if (part.type === 'file') {
        if (part.source?.type === 'file' && part.source.path) {
          addArtifact(artifacts, part.source.path)
        } else if (part.filename) {
          addArtifact(artifacts, part.filename)
        }
      }

      if (part.type === 'tool') {
        collectPathsFromInput(part.state.input).forEach((file) => addArtifact(artifacts, file))
        getAttachments(part).forEach((attachment) => {
          if (attachment.filename) {
            addArtifact(artifacts, attachment.filename)
          }
        })
      }
    }
  }

  filePaths?.forEach((file) => addArtifact(artifacts, file))

  return Array.from(artifacts.values())
}

export function useArtifacts(messages: Message[], filePaths?: string[]) {
  const artifacts = useMemo(() => extractArtifacts(messages, filePaths), [messages, filePaths])

  return {
    artifacts,
  }
}
