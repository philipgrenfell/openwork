import { useMemo, useState } from 'react'
import { Circle, Clock, CheckCircle2, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { QuestionAnswer, QuestionRequest, Step, StepStatus } from '@/types'

const statusConfig: Record<StepStatus, { 
  label: string
  icon: typeof Circle
  className: string 
}> = {
  queued: { 
    label: 'Queued', 
    icon: Circle, 
    className: 'text-neutral-400 bg-neutral-100' 
  },
  running: { 
    label: 'Running', 
    icon: Clock, 
    className: 'text-orange-600 bg-orange-50' 
  },
  success: { 
    label: 'Done', 
    icon: CheckCircle2, 
    className: 'text-green-600 bg-green-50' 
  },
  failed: { 
    label: 'Failed', 
    icon: XCircle, 
    className: 'text-red-600 bg-red-50' 
  },
}

function renderInline(text: string, keyPrefix: string) {
  const segments = text.split('`')
  const nodes: Array<string | JSX.Element> = []
  let keyIndex = 0

  segments.forEach((segment, index) => {
    if (index % 2 === 1) {
      nodes.push(
        <code
          key={`${keyPrefix}-code-${keyIndex}`}
          className="rounded bg-[#f3efe8] px-1 py-0.5 text-[0.85em] text-neutral-700"
        >
          {segment}
        </code>
      )
      keyIndex += 1
      return
    }

    const boldParts = segment.split('**')
    boldParts.forEach((part, boldIndex) => {
      if (boldIndex % 2 === 1) {
        nodes.push(
          <strong key={`${keyPrefix}-bold-${keyIndex}`} className="font-semibold text-neutral-700">
            {part}
          </strong>
        )
      } else if (part) {
        nodes.push(part)
      }
      keyIndex += 1
    })
  })

  return nodes
}

function renderMarkdown(text: string) {
  const lines = text.split('\n')
  const elements: JSX.Element[] = []
  let listItems: JSX.Element[] = []
  let keyIndex = 0

  const flushList = () => {
    if (listItems.length === 0) return
    elements.push(
      <ul key={`list-${keyIndex}`} className="ml-4 list-disc space-y-1 text-sm text-neutral-600">
        {listItems}
      </ul>
    )
    keyIndex += 1
    listItems = []
  }

  lines.forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed) {
      flushList()
      return
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/)
    if (headingMatch) {
      flushList()
      const level = headingMatch[1].length
      const content = headingMatch[2]
      const Tag = level === 1 ? 'h3' : level === 2 ? 'h4' : 'h5'
      elements.push(
        <Tag key={`heading-${keyIndex}`} className="text-sm font-semibold text-neutral-700">
          {renderInline(content, `heading-${keyIndex}`)}
        </Tag>
      )
      keyIndex += 1
      return
    }

    const listMatch = trimmed.match(/^[-*]\s+(.*)$/)
    if (listMatch) {
      const content = listMatch[1]
      listItems.push(
        <li key={`list-item-${keyIndex}`} className="text-sm text-neutral-600">
          {renderInline(content, `list-item-${keyIndex}`)}
        </li>
      )
      keyIndex += 1
      return
    }

    flushList()
    elements.push(
      <p key={`paragraph-${keyIndex}`} className="text-sm text-neutral-600">
        {renderInline(trimmed, `paragraph-${keyIndex}`)}
      </p>
    )
    keyIndex += 1
  })

  flushList()
  return elements
}

interface StepsPanelProps {
  steps: Step[]
  questions: QuestionRequest[]
  onReplyQuestion: (requestId: string, answers: QuestionAnswer[]) => Promise<void>
  onQuickReply: (text: string) => void
  onReset: () => void
}

function questionKey(requestId: string, index: number) {
  return `${requestId}:${index}`
}

export function StepsPanel({ steps, questions, onReplyQuestion, onQuickReply, onReset }: StepsPanelProps) {
  const [selected, setSelected] = useState<Record<string, string[]>>({})
  const [custom, setCustom] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [quickReply, setQuickReply] = useState<Record<string, string>>({})

  const lastAssistantId = useMemo(() => {
    return [...steps].reverse().find((step) => step.title === 'Assistant')?.id
  }, [steps])

  const requestAnswers = useMemo(() => {
    return questions.reduce<Record<string, QuestionAnswer[]>>((acc, request) => {
      acc[request.id] = request.questions.map((_, index) => {
        const key = questionKey(request.id, index)
        const selections = selected[key] || []
        const customValue = custom[key]?.trim()
        if (customValue) {
          return [...selections, customValue]
        }
        return selections
      })
      return acc
    }, {})
  }, [questions, selected, custom])

  const handleToggle = (requestId: string, index: number, label: string, multiple?: boolean) => {
    const key = questionKey(requestId, index)
    setSelected((prev) => {
      const current = prev[key] || []
      if (!multiple) {
        return { ...prev, [key]: current.includes(label) ? [] : [label] }
      }
      return current.includes(label)
        ? { ...prev, [key]: current.filter((item) => item !== label) }
        : { ...prev, [key]: [...current, label] }
    })
  }

  const handleReply = async (requestId: string) => {
    const answers = requestAnswers[requestId] || []
    await onReplyQuestion(requestId, answers)
    setSelected((prev) => {
      const next = { ...prev }
      Object.keys(next)
        .filter((key) => key.startsWith(`${requestId}:`))
        .forEach((key) => {
          delete next[key]
        })
      return next
    })
    setCustom((prev) => {
      const next = { ...prev }
      Object.keys(next)
        .filter((key) => key.startsWith(`${requestId}:`))
        .forEach((key) => {
          delete next[key]
        })
      return next
    })
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-neutral-700">Steps</div>
        <Button
          variant="ghost"
          className="h-8 rounded-xl text-neutral-500 hover:bg-white/70"
          onClick={onReset}
        >
          Reset
        </Button>
      </div>
      
      <div className="mt-3 rounded-2xl border border-neutral-200/70 bg-white/70">
        <ScrollArea className="h-[300px]">
          <div className="p-3 space-y-3">
            {questions.length > 0 && (
              <div className="space-y-4">
                {questions.map((request) => (
                  <div key={request.id} className="rounded-2xl bg-white/80 p-4 border border-neutral-200/60">
                    <div className="text-sm font-semibold text-neutral-700">Questions</div>
                    <div className="mt-3 space-y-4">
                      {request.questions.map((question, index) => {
                        const key = questionKey(request.id, index)
                        const selections = selected[key] || []
                        const allowCustom = question.custom !== false
                        return (
                          <div key={key} className="rounded-2xl border border-neutral-200/60 bg-white/70 p-3">
                            <div className="text-xs uppercase tracking-wide text-neutral-400">{question.header}</div>
                            <div className="text-sm font-medium text-neutral-700 mt-1">{question.question}</div>
                            <div className="mt-3 grid gap-2">
                              {question.options.map((option) => (
                                <button
                                  key={option.label}
                                  type="button"
                                  onClick={() => handleToggle(request.id, index, option.label, question.multiple)}
                                  className={cn(
                                    'w-full rounded-xl border px-3 py-2 text-left text-sm transition',
                                    selections.includes(option.label)
                                      ? 'border-[#d8a489] bg-[#f5ebe3] text-neutral-800'
                                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                                  )}
                                >
                                  <div className="font-medium">{option.label}</div>
                                  <div className="text-xs text-neutral-500 mt-1">{option.description}</div>
                                </button>
                              ))}
                            </div>
                            {allowCustom && (
                              <div className="mt-3">
                                <input
                                  type="text"
                                  value={custom[key] || ''}
                                  onChange={(event) =>
                                    setCustom((prev) => ({ ...prev, [key]: event.target.value }))
                                  }
                                  placeholder="Add a custom answer..."
                                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-[#d8a489] focus:outline-none"
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="secondary"
                        className="rounded-xl bg-[#d8a489] text-white hover:bg-[#c99275]"
                        onClick={() => handleReply(request.id)}
                      >
                        Send answers
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {steps.length === 0 ? (
              <div className="rounded-2xl bg-[#f3efe8] p-4">
                <div className="text-sm font-semibold text-neutral-700">Waiting to start...</div>
                <div className="text-sm text-neutral-500 mt-1">
                  Send a message or click an action tile to kick off a plan.
                </div>
              </div>
            ) : (
              steps.map((step) => {
                const config = statusConfig[step.status]
                const Icon = config.icon
                const showToggle = step.detail.length > 220
                const isExpanded = expanded[step.id] || false
                const showQuickReply =
                  questions.length === 0 &&
                  step.title === 'Assistant' &&
                  step.id === lastAssistantId &&
                  step.detail.includes('?')
                
                return (
                  <div
                    key={step.id}
                    className="rounded-2xl bg-white/80 p-4 border border-transparent hover:border-neutral-200 transition"
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={cn('h-4 w-4 mt-0.5', config.className.split(' ')[0])} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold">{step.title}</div>
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            config.className
                          )}>
                            {config.label}
                          </span>
                        </div>
                        {step.detail && (
                          <div className={cn('mt-2 space-y-2', !isExpanded && 'max-h-32 overflow-hidden')}>
                            {renderMarkdown(step.detail)}
                          </div>
                        )}
                        {showToggle && (
                          <button
                            type="button"
                            className="mt-2 text-xs font-medium text-[#c99275] hover:text-[#b67b5d]"
                            onClick={() =>
                              setExpanded((prev) => ({ ...prev, [step.id]: !prev[step.id] }))
                            }
                          >
                            {isExpanded ? 'Show less' : 'Show more'}
                          </button>
                        )}
                        {showQuickReply && (
                          <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-3">
                            <div className="text-xs uppercase tracking-wide text-neutral-400">Answer</div>
                            <textarea
                              value={quickReply[step.id] || ''}
                              onChange={(event) =>
                                setQuickReply((prev) => ({ ...prev, [step.id]: event.target.value }))
                              }
                              placeholder="Type your response..."
                              className="mt-2 min-h-[72px] w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-[#d8a489] focus:outline-none"
                            />
                            <div className="mt-3 flex justify-end">
                              <Button
                                variant="secondary"
                                className="rounded-xl bg-[#d8a489] text-white hover:bg-[#c99275]"
                                disabled={!quickReply[step.id]?.trim()}
                                onClick={() => {
                                  const value = quickReply[step.id]?.trim()
                                  if (!value) return
                                  setQuickReply((prev) => ({ ...prev, [step.id]: '' }))
                                  onQuickReply(value)
                                }}
                              >
                                Send reply
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
