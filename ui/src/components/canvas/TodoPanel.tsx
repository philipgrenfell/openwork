import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react'

import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { TodoItem, TodoStatus } from '@/types'

const statusConfig: Record<TodoStatus, { label: string; icon: typeof Circle; className: string }> = {
  pending: { label: 'Pending', icon: Circle, className: 'text-neutral-400 bg-neutral-100' },
  in_progress: { label: 'In progress', icon: Clock, className: 'text-orange-600 bg-orange-50' },
  completed: { label: 'Done', icon: CheckCircle2, className: 'text-green-600 bg-green-50' },
  cancelled: { label: 'Cancelled', icon: XCircle, className: 'text-red-600 bg-red-50' },
}

interface TodoPanelProps {
  todos: TodoItem[]
}

export function TodoPanel({ todos }: TodoPanelProps) {
  return (
    <div className="mt-6">
      <div className="text-sm font-semibold text-neutral-700">To do</div>
      <div className="mt-3 rounded-2xl border border-neutral-200/70 bg-white/70">
        <ScrollArea className="h-[200px]">
          <div className="p-3 space-y-3">
            {todos.length === 0 ? (
              <div className="rounded-2xl bg-[#f3efe8] p-4">
                <div className="text-sm font-semibold text-neutral-700">No todo list yet</div>
                <div className="text-sm text-neutral-500 mt-1">
                  OpenCode will surface todos as it plans the task.
                </div>
              </div>
            ) : (
              todos.map((todo) => {
                const config = statusConfig[todo.status]
                const Icon = config.icon

                return (
                  <div
                    key={todo.id}
                    className="rounded-2xl bg-white/80 p-3 border border-transparent hover:border-neutral-200 transition"
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={cn('h-4 w-4 mt-0.5', config.className.split(' ')[0])} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold">{todo.content}</div>
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                              config.className
                            )}
                          >
                            {config.label}
                          </span>
                        </div>
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
