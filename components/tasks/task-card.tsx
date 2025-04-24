"use client"

import { useState } from "react"
import type { Task } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { format } from "date-fns"
import { Edit, Trash2, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import TaskDialog from "./task-dialog"

interface TaskCardProps {
  task: Task
  onDelete: (id: string) => Promise<void>
}

export default function TaskCard({ task, onDelete }: TaskCardProps) {
  const [isCompleted, setIsCompleted] = useState(task.is_completed)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const supabase = createClient()

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
    data: {
      task,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleCompletionChange = async () => {
    const newValue = !isCompleted
    setIsCompleted(newValue)

    await supabase.from("tasks").update({ is_completed: newValue }).eq("id", task.id)
  }

  return (
    <>
      <Card ref={setNodeRef} style={style} className={cn("mb-3 relative group", isCompleted && "opacity-60")}>
        <CardContent className="p-4 flex items-start gap-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab mt-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="h-5 w-5" />
          </div>

          <Checkbox checked={isCompleted} onCheckedChange={handleCompletionChange} className="mt-1" />

          <div className="flex-1">
            <h3 className={cn("font-medium", isCompleted && "line-through")}>{task.title}</h3>
            {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
            {task.due_date && (
              <p className="text-xs text-muted-foreground mt-2">
                Due: {format(new Date(task.due_date), "MMM d, yyyy")}
              </p>
            )}
            {task.category && (
              <div className="flex items-center mt-2">
                <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: task.category.color }} />
                <span className="text-xs">{task.category.name}</span>
              </div>
            )}
          </div>

          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(task.id)}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <TaskDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} task={task} />
    </>
  )
}
