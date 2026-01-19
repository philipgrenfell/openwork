import { useState } from 'react'
import { MoreVertical, Trash2 } from 'lucide-react'

import { cn, formatRelative } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

import type { Task } from '@/types'

interface TaskItemProps {
  task: Task
  isSelected: boolean
  onClick: () => void
  onDelete: (taskId: string) => void
}

export function TaskItem({ task, isSelected, onClick, onDelete }: TaskItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const handleDelete = () => {
    onDelete(task.id)
  }
  
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
    >
      <button
        onClick={onClick}
        className={cn(
          'w-full text-left rounded-2xl px-3 py-2 transition border',
          isSelected
            ? 'bg-white border-neutral-200 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.4)]'
            : 'bg-transparent border-transparent hover:bg-white/80'
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate text-neutral-700">{task.title}</div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-400">
              <span>{task.status}</span>
              <span>•</span>
              <span>{formatRelative(Date.now() - task.updated)}</span>
            </div>
          </div>
          
          {(isHovered || isSelected) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center h-6 w-6 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-red-600 hover:bg-red-50 focus:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </button>
    </div>
  )
}
