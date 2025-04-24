"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Task, Category } from "@/lib/types"
import TaskCard from "./task-card"
import TaskDialog from "./task-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Plus, Search, Filter, Loader2 } from "lucide-react"

interface TaskListProps {
  initialTasks: Task[]
  initialCategories: Category[]
  categoryId?: string
}

export default function TaskList({ initialTasks, initialCategories, categoryId }: TaskListProps) {
  const router = useRouter()
  const supabase = createClient()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

  const filteredTasks = tasks.filter((task) => {
    // Apply search filter
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))

    // Apply status filter
    const matchesStatus =
      statusFilter === "all" ? true : statusFilter === "completed" ? task.is_completed : !task.is_completed

    return matchesSearch && matchesStatus
  })

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })

      // Update priorities in database
      const updatedTasks = arrayMove(
        [...tasks],
        tasks.findIndex((task) => task.id === active.id),
        tasks.findIndex((task) => task.id === over.id),
      )

      // Update priorities based on new order
      for (let i = 0; i < updatedTasks.length; i++) {
        await supabase.from("tasks").update({ priority: i }).eq("id", updatedTasks[i].id)
      }
    }
  }

  const handleDeleteTask = async (id: string) => {
    setIsLoading(true)

    await supabase.from("tasks").delete().eq("id", id)

    setTasks(tasks.filter((task) => task.id !== id))
    setIsLoading(false)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No tasks found</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create your first task
          </Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} onDelete={handleDeleteTask} />
            ))}
          </SortableContext>
        </DndContext>
      )}

      <TaskDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  )
}
