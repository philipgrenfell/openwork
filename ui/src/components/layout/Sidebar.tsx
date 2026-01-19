import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TaskList } from '@/components/tasks/TaskList'
import type { Task } from '@/types'

interface SidebarProps {
  tasks: Task[]
  selectedTaskId: string | null
  onSelectTask: (id: string) => void
  onNewTask: () => void
  onDeleteTask: (id: string) => void
  loading?: boolean
}

export function Sidebar({ 
  tasks, 
  selectedTaskId, 
  onSelectTask, 
  onNewTask,
  onDeleteTask,
  loading 
}: SidebarProps) {
  return (
    <Card className="col-span-12 md:col-span-3 h-full rounded-[28px] border border-neutral-200/70 bg-[#fbf9f6] shadow-[0_18px_60px_-50px_rgba(0,0,0,0.35)]">
      <CardContent className="p-5 flex h-full flex-col">
        <Button 
          onClick={onNewTask} 
          className="w-full rounded-2xl justify-start gap-2 bg-white text-neutral-800 shadow-[0_12px_40px_-30px_rgba(0,0,0,0.4)] hover:bg-white/90"
        >
          <Plus className="h-4 w-4 text-[#d98c6c]" />
          New task
        </Button>
        
        <div className="mt-5 flex-1 flex flex-col">
          <div className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-3">
            Tasks
          </div>
          <div className="rounded-2xl border border-neutral-200/70 bg-white/70 flex-1 flex flex-col">
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="p-4 text-center text-sm text-neutral-400">
                  Loading tasks...
                </div>
              ) : tasks.length === 0 ? (
                <div className="p-4 text-center text-sm text-neutral-400">
                  No tasks yet. Create one to get started!
                </div>
              ) : (
                <TaskList
                  tasks={tasks}
                  selectedTaskId={selectedTaskId}
                  onSelectTask={onSelectTask}
                  onDeleteTask={onDeleteTask}
                />
              )}
            </ScrollArea>
          </div>
          
          <div className="mt-4 text-xs text-neutral-400">
            Tasks are managed locally and stay on this device.
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
