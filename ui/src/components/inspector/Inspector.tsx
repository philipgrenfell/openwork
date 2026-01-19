import { ProgressCard } from './ProgressCard'
import { ArtifactsCard } from './ArtifactsCard'
import { ContextCard } from './ContextCard'
import type { Step, Artifact, ContextItem, TodoItem } from '@/types'

interface InspectorProps {
  steps: Step[]
  todos: TodoItem[]
  artifacts: Artifact[]
  context: ContextItem[]
  isConnected: boolean
  directory?: string
}

export function Inspector({ steps, todos, artifacts, context, isConnected, directory }: InspectorProps) {
  return (
    <div className="col-span-12 md:col-span-3 h-full">
      <div className="h-full space-y-4">
        <ProgressCard todos={todos} />
        <ArtifactsCard artifacts={artifacts} directory={directory} />
        <ContextCard context={context} isConnected={isConnected} />
      </div>
    </div>
  )
}
