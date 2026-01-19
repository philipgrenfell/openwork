import { TaskItem } from './TaskItem'
import type { Task } from '@/types'

interface TaskListProps {
  tasks: Task[]
  selectedTaskId: string | null
  onSelectTask: (id: string) => void
  onDeleteTask: (id: string) => void
}

export function TaskList({ tasks, selectedTaskId, onSelectTask, onDeleteTask }: TaskListProps) {
  return (
    <div className="p-2 space-y-1">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          isSelected={task.id === selectedTaskId}
          onClick={() => onSelectTask(task.id)}
          onDelete={onDeleteTask}
        />
      ))}
    </div>
  )
}
