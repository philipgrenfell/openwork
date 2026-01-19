// Core application types

export type AgentMode = 'plan' | 'build'

export type TaskStatus = 'idle' | 'running' | 'completed' | 'error'

export type StepStatus = 'queued' | 'running' | 'success' | 'failed'

export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export type TodoPriority = 'high' | 'medium' | 'low'

export interface Task {
  id: string
  title: string
  status: string
  started: boolean
  updated: number
  directory?: string
  agentMode?: AgentMode
}

export interface Step {
  id: string
  title: string
  detail: string
  rawDetail?: string
  status: StepStatus
}

export interface Artifact {
  id: string
  name: string
  path: string
  kind: 'code' | 'json' | 'csv' | 'image' | 'markdown' | 'text' | 'other'
}

export interface TodoItem {
  id: string
  content: string
  status: TodoStatus
  priority: TodoPriority
}

export interface QuestionOption {
  label: string
  description: string
}

export interface QuestionInfo {
  question: string
  header: string
  options: QuestionOption[]
  multiple?: boolean
  custom?: boolean
}

export interface QuestionRequest {
  id: string
  sessionID: string
  questions: QuestionInfo[]
  tool?: {
    messageID: string
    callID: string
  }
}

export type QuestionAnswer = string[]

export interface ContextItem {
  id: string
  title: string
  subtitle: string
}

export interface ModelRef {
  providerID: string
  modelID: string
}

export interface ProviderModel {
  id: string
  name: string
  providerID: string
}

export interface ProviderConfig {
  id: string
  name: string
  models: Record<string, ProviderModel>
}

export interface ProvidersResponse {
  providers: ProviderConfig[]
  default: Record<string, string>
}

// OpenCode API types
export interface Session {
  id: string
  title: string
  directory: string
  parentID?: string
  time: {
    created: number
    updated: number
  }
  summary?: {
    additions: number
    deletions: number
    files: number
  }
}

export interface FileDiff {
  file: string
  before: string
  after: string
  additions: number
  deletions: number
}

export interface MessageInfoBase {
  id: string
  sessionID: string
  role: 'user' | 'assistant'
  time: {
    created: number
    completed?: number
  }
}

export interface UserMessageInfo extends MessageInfoBase {
  role: 'user'
  summary?: {
    title?: string
    body?: string
    diffs: FileDiff[]
  }
  agent?: string
}

export interface AssistantMessageInfo extends MessageInfoBase {
  role: 'assistant'
  parentID?: string
}

export type MessageInfo = UserMessageInfo | AssistantMessageInfo

export interface TextPart {
  type: 'text'
  text?: string
}

export interface ToolStatePending {
  status: 'pending'
  input: Record<string, unknown>
}

export interface ToolStateRunning {
  status: 'running'
  input: Record<string, unknown>
}

export interface ToolStateCompleted {
  status: 'completed'
  input: Record<string, unknown>
  output: string
  attachments?: FilePart[]
}

export interface ToolStateError {
  status: 'error'
  input: Record<string, unknown>
  error: string
}

export type ToolState = ToolStatePending | ToolStateRunning | ToolStateCompleted | ToolStateError

export interface ToolPart {
  type: 'tool'
  tool: string
  state: ToolState
}

export interface PatchPart {
  type: 'patch'
  hash: string
  files: string[]
}

export interface StepStartPart {
  type: 'step-start'
  snapshot?: string
}

export interface StepFinishPart {
  type: 'step-finish'
  reason: string
  snapshot?: string
}

export interface FilePartSource {
  type: 'file' | 'symbol' | 'resource'
  path?: string
  uri?: string
}

export interface FilePart {
  type: 'file'
  mime: string
  filename?: string
  url: string
  source?: FilePartSource
}

export type MessagePart =
  | TextPart
  | ToolPart
  | PatchPart
  | StepStartPart
  | StepFinishPart
  | FilePart

export interface Message {
  info: MessageInfo
  parts: MessagePart[]
}

export interface FileStatus {
  path: string
  type: 'modified' | 'created' | 'deleted'
}

export interface HealthStatus {
  bridge: {
    status: 'ok' | 'error'
    timestamp: string
  }
  opencode: {
    status: 'ok' | 'error'
    version?: string
    error?: string
  }
}

// Transform session to task
export function sessionToTask(session: Session): Task {
  return {
    id: session.id,
    title: session.title || 'Untitled task',
    status: 'Draft',
    started: false,
    directory: session.directory,
    updated: session.time?.updated || session.time?.created || Date.now(),
  }
}

// Get artifact kind from file extension
export function getArtifactKind(path: string): Artifact['kind'] {
  const ext = path.split('.').pop()?.toLowerCase() || ''
  switch (ext) {
    case 'json':
      return 'json'
    case 'csv':
      return 'csv'
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return 'image'
    case 'md':
    case 'markdown':
      return 'markdown'
    case 'txt':
      return 'text'
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'py':
    case 'go':
    case 'rs':
    case 'java':
    case 'c':
    case 'cpp':
    case 'h':
    case 'css':
    case 'html':
      return 'code'
    default:
      return 'other'
  }
}
