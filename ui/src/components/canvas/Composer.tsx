import { useEffect, useRef } from 'react'
import { Plus, ChevronDown, ArrowUp, CheckCircle2, Loader2, Image as ImageIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import type { ModelOption } from '@/hooks/useModels'
import type { AgentMode, ModelRef } from '@/types'

interface ComposerProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  agentMode: AgentMode
  onAgentModeChange: (mode: AgentMode) => void
  modelOptions: ModelOption[]
  selectedModel: ModelRef | null
  defaultModel: ModelRef | null
  onModelChange: (model: ModelRef) => void
  onImportFolder: (files: FileList) => void
  onAttachFolder: (path: string) => void
  disabled?: boolean
  sending?: boolean
}

export function Composer({ 
  value, 
  onChange, 
  onSend, 
  agentMode,
  onAgentModeChange,
  modelOptions,
  selectedModel,
  defaultModel,
  onModelChange,
  onImportFolder,
  onAttachFolder,
  disabled,
  sending 
}: ComposerProps) {
  const selected = selectedModel || defaultModel
  const selectedOption = selected
    ? modelOptions.find(
        (option) => option.providerID === selected.providerID && option.modelID === selected.modelID
      )
    : null
  const selectedLabel = selectedOption
    ? `${selectedOption.providerName} ${selectedOption.name}`
    : 'Select model'
  const isDefault =
    !!selected &&
    !!defaultModel &&
    selected.providerID === defaultModel.providerID &&
    selected.modelID === defaultModel.modelID
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const folderInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = '0px'
    const next = Math.min(el.scrollHeight, 160)
    el.style.height = `${Math.max(next, 40)}px`
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      onSend()
    }
  }

  const handleFolderImport = () => {
    folderInputRef.current?.click()
  }

  const handleFolderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      onImportFolder(files)
    }
    event.target.value = ''
  }
  
  return (
    <div className="rounded-[24px] border border-neutral-200/70 bg-white/80 p-4 shadow-[0_14px_50px_-40px_rgba(0,0,0,0.45)]">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={disabled ? 'Select a task first...' : 'Ask anything...'}
        className="w-full resize-none border-0 bg-transparent text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
        onKeyDown={handleKeyDown}
        disabled={disabled || sending}
        rows={1}
      />

      <div className="mt-0.5 flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="shrink-0 rounded-2xl bg-[#f2ede5] px-3 py-2 text-xs text-neutral-600 flex items-center gap-2 hover:bg-[#ece5db] transition"
            >
              <span className="capitalize">{agentMode}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuLabel>Agent Mode</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onAgentModeChange('plan')}>
              <span className="flex-1">Plan</span>
              {agentMode === 'plan' && <CheckCircle2 className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAgentModeChange('build')}>
              <span className="flex-1">Build</span>
              {agentMode === 'build' && <CheckCircle2 className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <span className="text-xs text-neutral-400">
                Plan: Creates a plan without executing
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="shrink-0 rounded-2xl bg-[#f2ede5] px-3 py-2 text-xs text-neutral-600 flex items-center gap-2 hover:bg-[#ece5db] transition"
            >
              <span className="truncate max-w-[180px]">{selectedLabel}</span>
              <span className="text-neutral-400 text-[10px] uppercase tracking-wide">
                {isDefault ? 'Default' : 'Model'}
              </span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60 max-h-64 overflow-auto">
            <DropdownMenuLabel>Model</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {modelOptions.length === 0 ? (
              <DropdownMenuItem disabled>
                <span className="text-xs text-neutral-400">No models available</span>
              </DropdownMenuItem>
            ) : (
              modelOptions.map((option) => {
                const isSelected =
                  selected?.providerID === option.providerID && selected?.modelID === option.modelID
                return (
                  <DropdownMenuItem
                    key={`${option.providerID}:${option.modelID}`}
                    onClick={() => onModelChange({ providerID: option.providerID, modelID: option.modelID })}
                  >
                    <span className="flex-1 text-xs">{option.providerName} {option.name}</span>
                    {isSelected && <CheckCircle2 className="h-4 w-4" />}
                  </DropdownMenuItem>
                )
              })
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="shrink-0 h-9 w-9 rounded-2xl p-0 text-neutral-500 hover:bg-neutral-100/80"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuLabel>Workspace</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleFolderImport}>
              Import folder
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const path = window.prompt('Enter a folder path to attach')
                if (path?.trim()) {
                  onAttachFolder(path.trim())
                }
              }}
            >
              Attach folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          className="shrink-0 h-9 w-9 rounded-2xl p-0 text-neutral-500 hover:bg-neutral-100/80"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <div className="text-[11px] text-neutral-400">
            Tip: {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} + Enter to send
          </div>
          <Button 
            onClick={onSend} 
            className="shrink-0 h-9 rounded-2xl px-4 bg-[#d98c6c] text-white hover:bg-[#c97f62]"
            disabled={disabled || !value.trim() || sending}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <input
        ref={folderInputRef}
        type="file"
        multiple
        // @ts-expect-error webkitdirectory is supported by Chromium-based browsers
        webkitdirectory="true"
        onChange={handleFolderChange}
        className="hidden"
      />
    </div>
  )
}
