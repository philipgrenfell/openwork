import { useState, useEffect, useCallback } from 'react'
import { AppHeader } from '@/components/layout/AppHeader'
import { Sidebar } from '@/components/layout/Sidebar'
import { Canvas } from '@/components/canvas/Canvas'
import { Inspector } from '@/components/inspector/Inspector'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useOpenCodeConnection } from '@/hooks/useOpenCodeConnection'
import { useSessions } from '@/hooks/useSessions'
import { useMessages } from '@/hooks/useMessages'
import { useArtifacts } from '@/hooks/useArtifacts'
import { useSSE } from '@/hooks/useSSE'
import { useMessageTodos } from '@/hooks/useMessageTodos'
import { useTodos } from '@/hooks/useTodos'
import { useQuestions } from '@/hooks/useQuestions'
import { useModels } from '@/hooks/useModels'
import { useWorkspaceFiles } from '@/hooks/useWorkspaceFiles'
import { buildApiUrl } from '@/lib/api/client'
import { attachWorkspace, createWorkspace, getWorkspaceRoot, importWorkspace } from '@/lib/api/workspace'
import type { Task, AgentMode, ContextItem, ModelRef } from '@/types'

export default function App() {
  const { health, isConnected } = useOpenCodeConnection()
  const [workspaceRoot, setWorkspaceRoot] = useState<string | null>(null)
  const [sseDisabledUntil, setSseDisabledUntil] = useState(0)
  const [sessionModels, setSessionModels] = useState<Record<string, ModelRef>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const { tasks, loading: tasksLoading, create, remove, refresh: refreshSessions } = useSessions()
  
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [localTasks, setLocalTasks] = useState<Task[]>([])
  const selectedTask = localTasks.find(t => t.id === selectedTaskId) || null
  const activeDirectory = selectedTask?.directory || workspaceRoot || undefined
  
  // Messages and steps for the selected task
  const { 
    messages,
    steps, 
    sending, 
    send, 
    refresh: refreshMessages 
  } = useMessages(selectedTaskId, activeDirectory)
  
  const messageCount = messages.length
  const artifactDirectory = selectedTask?.directory
  const { files: workspaceFiles } = useWorkspaceFiles(artifactDirectory, messageCount)
  
  // File artifacts
  const { artifacts } = useArtifacts(messages, workspaceFiles)

  const messageTodos = useMessageTodos(messages)
  const { todos, setTodos, refresh: refreshTodos } = useTodos(selectedTaskId, selectedTask?.directory)
  const mergedTodos = todos.length > 0 ? todos : messageTodos
  const { questions, reply: replyQuestion, refresh: refreshQuestions } = useQuestions(
    selectedTaskId,
    selectedTask?.directory
  )
  const { options: modelOptions, defaultModel } = useModels(selectedTask?.directory)
  const selectedModel = selectedTaskId ? sessionModels[selectedTaskId] || defaultModel : defaultModel
  
  // SSE for real-time updates
  const sseEnabled = health?.opencode.status === 'ok' && Date.now() > sseDisabledUntil
  const sseUrl = sseEnabled
    ? buildApiUrl('/opencode/event', { directory: activeDirectory || workspaceRoot || undefined })
    : ''
  const { connected: sseConnected } = useSSE(sseUrl, {
    onMessage: useCallback((event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'opencode.offline') {
          const retryAfter = typeof data.retryAfterMs === 'number' ? data.retryAfterMs : 15000
          setSseDisabledUntil(Date.now() + retryAfter)
          return
        }
        if (data.type === 'todo.updated') {
          if (data.properties?.sessionID === selectedTaskId && Array.isArray(data.properties?.todos)) {
            setTodos(data.properties.todos)
          }
          return
        }
        if (data.type === 'question.asked' || data.type === 'question.replied' || data.type === 'question.rejected') {
          refreshQuestions()
          return
        }
        // Refresh relevant data based on event type
        if (data.type?.includes('message') || data.type?.includes('session')) {
          refreshMessages()
          refreshSessions()
        }
      } catch {
        // Ignore parse errors from SSE
      }
    }, [refreshMessages, refreshSessions, refreshQuestions, selectedTaskId, setTodos]),
    onConnect: useCallback(() => {
      console.log('SSE connected')
    }, []),
    onDisconnect: useCallback(() => {
      console.log('SSE disconnected')
    }, []),
  })

  useEffect(() => {
    if (!sseDisabledUntil) return
    const delay = sseDisabledUntil - Date.now()
    if (delay <= 0) {
      setSseDisabledUntil(0)
      return
    }
    const timeout = window.setTimeout(() => setSseDisabledUntil(0), delay)
    return () => window.clearTimeout(timeout)
  }, [sseDisabledUntil])
  
  // Sync server tasks with local state (add local modifications like 'started')
  useEffect(() => {
    setLocalTasks(prevLocal => {
      const mergedTasks = tasks.map(task => {
        const existing = prevLocal.find(t => t.id === task.id)
        const directory = task.directory || existing?.directory
        return {
          ...task,
          directory,
          started: existing?.started ?? false,
          status: existing?.status ?? task.status,
        }
      })

      return mergedTasks
    })
  }, [tasks, workspaceRoot])
  
  // Auto-select first task if none selected
  useEffect(() => {
    if (!selectedTaskId && localTasks.length > 0) {
      setSelectedTaskId(localTasks[0].id)
    }
  }, [selectedTaskId, localTasks])
  
  // Fetch messages when task changes
  useEffect(() => {
    if (selectedTaskId) {
      refreshMessages()
    }
  }, [selectedTaskId, refreshMessages])

  useEffect(() => {
    if (!selectedTaskId) return
    refreshTodos()
  }, [selectedTaskId, messageCount, refreshTodos])

  useEffect(() => {
    if (!selectedTaskId) return
    refreshQuestions()
  }, [selectedTaskId, messageCount, refreshQuestions])

  useEffect(() => {
    if (!selectedTaskId) return
    refreshSessions()
  }, [selectedTaskId, messageCount, refreshSessions])

  useEffect(() => {
    const loadWorkspaceRoot = async () => {
      try {
        const result = await getWorkspaceRoot()
        setWorkspaceRoot(result.root)
      } catch (error) {
        console.error('Failed to load workspace root:', error)
      }
    }
    loadWorkspaceRoot()
  }, [])
  
  const handleNewTask = async () => {
    try {
      const workspace = await createWorkspace(`task-${Date.now()}`)
      const session = await create(undefined, { directory: workspace.path })
      setSelectedTaskId(session.id)
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }
  
  const handleSelectTask = (id: string) => {
    setSelectedTaskId(id)
  }

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        if (result instanceof ArrayBuffer) {
          const bytes = new Uint8Array(result)
          let binary = ''
          for (let i = 0; i < bytes.byteLength; i += 1) {
            binary += String.fromCharCode(bytes[i])
          }
          resolve(btoa(binary))
          return
        }
        reject(new Error('Failed to read file'))
      }
      reader.onerror = () => reject(reader.error || new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    })

  const handleImportFolder = async (files: FileList) => {
    if (!files.length) return
    try {
      const first = files[0]
      const rootName = first.webkitRelativePath?.split('/')[0]
      const payload = await Promise.all(
        Array.from(files).map(async (file) => ({
          path: file.webkitRelativePath || file.name,
          content: await fileToBase64(file),
          encoding: 'base64',
        }))
      )
      const workspace = await importWorkspace(payload, rootName)
      const session = await create(undefined, { directory: workspace.path })
      setSelectedTaskId(session.id)
    } catch (error) {
      console.error('Failed to import folder:', error)
    }
  }

  const handleAttachFolder = async (path: string) => {
    try {
      const workspace = await attachWorkspace(path)
      const session = await create(undefined, { directory: workspace.path })
      setSelectedTaskId(session.id)
    } catch (error) {
      console.error('Failed to attach folder:', error)
    }
  }
  
  const handleSend = async (text: string, mode: AgentMode) => {
    if (!selectedTaskId) return
    
    // Mark task as started locally
    setLocalTasks(prev => prev.map(t => 
      t.id === selectedTaskId 
        ? { ...t, started: true, status: 'In progress' }
        : t
    ))
    
    try {
      await send(text, mode, selectedModel || undefined)
      await refreshSessions()
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }
  
  const handleReset = () => {
    if (!selectedTaskId) return
    
    setLocalTasks(prev => prev.map(t => 
      t.id === selectedTaskId 
        ? { ...t, started: false, status: 'Draft' }
        : t
    ))
  }
  
  const handleDeleteTask = (taskId: string) => {
    const task = localTasks.find(t => t.id === taskId)
    if (task) {
      setTaskToDelete(task)
      setDeleteDialogOpen(true)
    }
  }
  
  const confirmDeleteTask = async () => {
    if (!taskToDelete) return
    
    try {
      await remove(taskToDelete.id, { directory: taskToDelete.directory })
      
      // If the deleted task was selected, select another task
      if (selectedTaskId === taskToDelete.id) {
        const currentIndex = localTasks.findIndex(t => t.id === taskToDelete.id)
        const nextTask = localTasks[currentIndex - 1] || localTasks[currentIndex + 1]
        setSelectedTaskId(nextTask?.id || null)
      }
      
      setDeleteDialogOpen(false)
      setTaskToDelete(null)
    } catch (error) {
      console.error('Failed to delete task:', error)
      // Keep dialog open to show error or retry
    }
  }
  
  const context: ContextItem[] = [
    { 
      id: 'c1', 
      title: 'Workspace', 
      subtitle: selectedTask?.directory || workspaceRoot || 'Workspace root' 
    },
    { 
      id: 'c2', 
      title: 'Tools', 
      subtitle: !health
        ? 'Checking connection...'
        : health.bridge.status !== 'ok'
          ? 'Bridge offline'
          : health.opencode.status !== 'ok'
            ? 'OpenCode offline'
            : `OpenCode${sseConnected ? ' (live)' : ''}`
    },
    { 
      id: 'c3', 
      title: 'Files in use', 
      subtitle: `${artifacts.length} tracked` 
    },
  ]
  
  return (
    <div className="min-h-screen bg-[#f8f5f0] text-neutral-900">
      <AppHeader />
      
      <main className="mx-auto max-w-[1400px] px-4 py-6 min-h-[calc(100vh-64px)] bg-[radial-gradient(900px_circle_at_top,_rgba(231,220,207,0.55),_transparent)]">
        <div className="grid h-full grid-cols-12 gap-4">
          <Sidebar
            tasks={localTasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={handleSelectTask}
            onNewTask={handleNewTask}
            onDeleteTask={handleDeleteTask}
            loading={tasksLoading}
          />
          
          <Canvas
            task={selectedTask}
            steps={steps}
            todos={mergedTodos}
            questions={questions}
            onReplyQuestion={replyQuestion}
            onQuickReply={(text) => handleSend(text, 'build')}
            onSend={handleSend}
            modelOptions={modelOptions}
            selectedModel={selectedModel || null}
            defaultModel={defaultModel || null}
            onModelChange={(model) => {
              if (!selectedTaskId) return
              setSessionModels((prev) => ({ ...prev, [selectedTaskId]: model }))
            }}
            onImportFolder={handleImportFolder}
            onAttachFolder={handleAttachFolder}
            onReset={handleReset}
            sending={sending}
          />
          
          <Inspector
            steps={steps}
            todos={mergedTodos}
            artifacts={artifacts}
            context={context}
            isConnected={isConnected}
            directory={activeDirectory}
          />
        </div>
      </main>
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{taskToDelete?.title || 'this task'}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={confirmDeleteTask}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
