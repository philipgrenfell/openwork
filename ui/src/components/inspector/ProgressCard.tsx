import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { TodoItem } from '@/types'

interface ProgressCardProps {
  todos: TodoItem[]
}

export function ProgressCard({ todos }: ProgressCardProps) {
  const total = todos.length
  const completed = todos.filter((todo) => todo.status === 'completed').length
  const remaining = Math.max(total - completed, 0)
  const dots = total === 0 ? 3 : total
  
  return (
    <Card className="rounded-[24px] border border-neutral-200/70 bg-white/80 shadow-[0_14px_50px_-40px_rgba(0,0,0,0.45)]">
      <CardContent className="p-4">
        <div className="text-sm font-semibold mb-3 text-neutral-700">Progress</div>
        
        <div className="flex items-center gap-2">
          {Array.from({ length: dots }).map((_, i) => {
            const todo = todos[i]
            const isComplete = todo?.status === 'completed'
            const isRunning = todo?.status === 'in_progress'
            
            return (
              <div
                key={i}
                className={cn(
                  'h-5 w-5 rounded-full border',
                  isComplete ? 'bg-[#d8a489] border-[#d8a489]' :
                  isRunning ? 'bg-[#e6c1a8] border-[#e6c1a8] animate-pulse' :
                  'bg-neutral-100 border-neutral-200'
                )}
              />
            )
          })}
        </div>
        
        <div className="mt-2 text-xs text-neutral-500">
          {total === 0
            ? 'Todo list updates will appear here.'
            : `${completed} of ${total} complete • ${remaining} left`
          }
        </div>
      </CardContent>
    </Card>
  )
}
