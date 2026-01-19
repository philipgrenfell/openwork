import { Zap, Info, X } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WelcomeTiles } from './WelcomeTiles'
import { StepsPanel } from './StepsPanel'
import { TodoPanel } from './TodoPanel'
import { Composer } from './Composer'

import type { Task, Step, AgentMode, ModelRef, QuestionAnswer, QuestionRequest, TodoItem } from '@/types'
import type { ModelOption } from '@/hooks/useModels'

interface CanvasProps {
  task: Task | null
  steps: Step[]
  todos: TodoItem[]
  questions: QuestionRequest[]
  onReplyQuestion: (requestId: string, answers: QuestionAnswer[]) => Promise<void>
  onQuickReply: (text: string) => void
  onSend: (text: string, mode: AgentMode) => void
  modelOptions: ModelOption[]
  selectedModel: ModelRef | null
  defaultModel: ModelRef | null
  onModelChange: (model: ModelRef) => void
  onAttachFolder: (path: string) => void
  onReset: () => void
  sending?: boolean
}

export function Canvas({
  task,
  steps,
  todos,
  questions,
  onReplyQuestion,
  onQuickReply,
  onSend,
  modelOptions,
  selectedModel,
  defaultModel,
  onModelChange,
  onAttachFolder,
  onReset,
  sending,
}: CanvasProps) {
  const [showBanner, setShowBanner] = useState(true)
  const [composer, setComposer] = useState('')
  const [agentMode, setAgentMode] = useState<AgentMode>('build')
  
  const taskStarted = steps.length > 0 || sending
  const showSteps = !!task && (taskStarted || todos.length > 0)
  
  const handleSend = () => {
    if (composer.trim()) {
      onSend(composer.trim(), agentMode)
      setComposer('')
    }
  }
  
  const handleTileClick = (title: string) => {
    setComposer(`${title}: `)
  }
  
  return (
    <div className="col-span-12 md:col-span-6 h-full">
      <Card className="h-full rounded-[28px] border border-neutral-200/70 bg-[#fbf9f6] shadow-[0_20px_80px_-60px_rgba(15,15,15,0.35)]">
        <CardContent className="p-8 h-full">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-[#d98c6c] text-white flex items-center justify-center shadow-sm">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-semibold tracking-tight">
                    {taskStarted && task ? task.title : "Let's knock something off your list"}
                  </div>
                  <div className="text-sm text-neutral-500 mt-1">
                    {taskStarted && task ? 'In progress' : (task ? task.title : 'Select or create a task')}
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs text-neutral-400">
                <span className="inline-flex h-2 w-2 rounded-full bg-[#d98c6c]" />
                Calm mode
              </div>
            </div>
            
            {/* Info banner */}
            {showBanner && (
              <div className="mt-6 rounded-2xl border border-neutral-200/70 bg-white/70 p-3 flex items-start gap-3">
                <Info className="h-4 w-4 text-neutral-400 mt-0.5" />
                <div className="text-sm text-neutral-500 flex-1">
                  Openwork runs locally. Start OpenCode to unlock live updates.
                </div>
                <button 
                  className="text-neutral-400 hover:text-neutral-600" 
                  onClick={() => setShowBanner(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            
            {/* Quick start tiles */}
            {!showSteps && (
              <div className="mt-8 flex-1 flex items-end justify-center pb-8">
                <div className="w-full max-w-xl text-center animate-[openwork-fade_0.6s_ease-out]">
                  <div className="text-[15px] text-neutral-500 mb-4">
                    Pick a starting point to spin up a focused workspace.
                  </div>
                  <WelcomeTiles onTileClick={handleTileClick} />
                </div>
              </div>
            )}
            
            {/* Steps panel (only visible after task starts) */}
            {showSteps && (
              <div className="mt-8 animate-[openwork-rise_0.6s_ease-out]">
                <TodoPanel todos={todos} />
                <StepsPanel
                  steps={steps}
                  questions={questions}
                  onReplyQuestion={onReplyQuestion}
                  onQuickReply={onQuickReply}
                  onReset={onReset}
                />
              </div>
            )}
            
            {/* Composer */}
            <div className="mt-auto pt-8">
              <Composer
                value={composer}
                onChange={setComposer}
                onSend={handleSend}
                agentMode={agentMode}
                onAgentModeChange={setAgentMode}
                modelOptions={modelOptions}
                selectedModel={selectedModel}
                defaultModel={defaultModel}
                onModelChange={onModelChange}
                onAttachFolder={onAttachFolder}
                disabled={!task}
                sending={sending}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
