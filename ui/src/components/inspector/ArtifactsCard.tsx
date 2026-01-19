import { useState } from 'react'
import { Braces, Image as ImageIcon, FileText, Table, File, ExternalLink, Loader2 } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { getFileContent } from '@/lib/api/files'
import { openWorkspaceFile } from '@/lib/api/workspace'

import type { Artifact } from '@/types'

function ArtifactIcon({ kind }: { kind: Artifact['kind'] }) {
  const Icon = 
    kind === 'json' ? Braces :
    kind === 'image' ? ImageIcon :
    kind === 'text' || kind === 'markdown' ? FileText :
    kind === 'csv' ? Table :
    File
  
  return (
    <div className="h-9 w-9 rounded-xl bg-[#f2ede5] flex items-center justify-center">
      <Icon className="h-4 w-4 text-[#a37b67]" />
    </div>
  )
}

interface ArtifactsCardProps {
  artifacts: Artifact[]
  directory?: string
}

function normalizePath(path: string, directory?: string) {
  if (!directory) return path
  const normalized = directory.endsWith('/') ? directory : `${directory}/`
  if (path.startsWith(normalized)) return path.slice(normalized.length)
  if (path.startsWith(directory)) return path.slice(directory.length).replace(/^\/+/, '')
  return path
}

function base64ToBytes(input: string) {
  const binary = atob(input)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function contentToBlob(
  content: { content: string; encoding?: string; mimeType?: string },
  fallbackType: string
) {
  const mimeType = content.mimeType || fallbackType || 'text/plain'
  if (content.encoding === 'base64') {
    return new Blob([base64ToBytes(content.content)], { type: mimeType })
  }
  const withCharset = mimeType.startsWith('text/') ? `${mimeType};charset=utf-8` : mimeType
  return new Blob([content.content], { type: withCharset })
}

function getExtension(path: string) {
  const value = path.split('.').pop()
  return value ? value.toLowerCase() : ''
}

function isNativeOfficeFile(extension: string) {
  return ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(extension)
}

export function ArtifactsCard({ artifacts, directory }: ArtifactsCardProps) {
  const [openingId, setOpeningId] = useState<string | null>(null)

  const handleOpen = async (artifact: Artifact) => {
    if (openingId === artifact.id) return
    setOpeningId(artifact.id)
    let previewWindow: Window | null = null
    try {
      const path = normalizePath(artifact.path, directory)
      const extension = getExtension(path)
      if (isNativeOfficeFile(extension)) {
        await openWorkspaceFile(path, directory)
        return
      }
      previewWindow = window.open('', '_blank')
      const content = await getFileContent(path, { directory })
      const fallbackType =
        artifact.kind === 'json' ? 'application/json' :
        artifact.kind === 'csv' ? 'text/csv' :
        artifact.kind === 'markdown' ? 'text/markdown' :
        'text/plain'
      const blob = contentToBlob(content, fallbackType)
      const url = URL.createObjectURL(blob)
      if (previewWindow) {
        previewWindow.location.href = url
        previewWindow.focus()
      } else {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch (error) {
      console.error('Failed to open artifact:', error)
      if (previewWindow) {
        previewWindow.close()
      }
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <Card className="rounded-[24px] border border-neutral-200/70 bg-white/80 shadow-[0_14px_50px_-40px_rgba(0,0,0,0.45)]">
      <CardContent className="p-4">
        <div className="text-sm font-semibold mb-3 text-neutral-700">Artifacts</div>
        
        {artifacts.length === 0 ? (
          <div className="text-xs text-neutral-500">
            Outputs created during the task land here.
          </div>
        ) : (
          <div className="space-y-3">
            {artifacts.map((artifact) => (
                <button
                  key={artifact.id}
                  type="button"
                  onClick={() => handleOpen(artifact)}
                  disabled={openingId === artifact.id}
                  aria-busy={openingId === artifact.id}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-transparent px-2 py-1 text-left transition hover:border-neutral-200 hover:bg-white/90 disabled:opacity-60"
                >
                  <ArtifactIcon kind={artifact.kind} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{artifact.name}</div>
                    <div className="text-xs text-neutral-500 truncate">{artifact.path}</div>
                  </div>
                {openingId === artifact.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                ) : (
                  <ExternalLink className="h-4 w-4 text-neutral-300 transition group-hover:text-neutral-500" />
                )}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
