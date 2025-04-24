"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import type { Task, Category } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task
}

// Memoize Supabase client
function useSupabase() {
  return useMemo(() => createClient(), [])
}

// Fetch categories with SWR
function useCategories(supabase: ReturnType<typeof createClient>) {
  const fetcher = async () => {
    const { data, error } = await supabase.from("categories").select("*").order("name")
    if (error) throw error
    return data as Category[]
  }
  const { data, error, mutate } = useSWR<Category[]>("categories", fetcher)
  return {
    categories: data ?? [],
    isLoading: !data && !error,
    mutate,
  }
}

export default function TaskDialog({ open, onOpenChange, task }: TaskDialogProps) {
  const router = useRouter()
  const supabase = useSupabase()
  const { categories, isLoading: catLoading, mutate: refreshCats } = useCategories(supabase)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Populate form when editing
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || "")
      setDueDate(task.due_date ? new Date(task.due_date).toISOString().split("T")[0] : "")
      setCategoryId(task.category_id)
    } else {
      setTitle("")
      setDescription("")
      setDueDate("")
      setCategoryId(null)
    }
  }, [task, open])

  const handleSubmit = async () => {
    if (!title.trim()) return
    setIsSubmitting(true)

    // Get current user to satisfy RLS
    const {
      data: { session },
      error: sessErr,
    } = await supabase.auth.getSession()

    if (sessErr || !session) {
      toast.error("Not authenticated")
      setIsSubmitting(false)
      return
    }
    const userId = session.user.id

    const taskPayload = {
      title: title.trim(),
      description: description.trim() || null,
      due_date: dueDate || null,
      category_id: categoryId,
      user_id: userId,       // include user_id for INSERT
    }

    let error
    if (task) {
      // Update (user_id not needed here)
      ({ error } = await supabase
        .from("tasks")
        .update({ ...taskPayload, user_id: undefined })
        .eq("id", task.id))
    } else {
      // Create
      ({ error } = await supabase.from("tasks").insert(taskPayload))
    }

    setIsSubmitting(false)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(task ? "Task updated" : "Task created")
      onOpenChange(false)
      router.refresh()
      refreshCats()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create Task"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description (optional)"
              className="resize-none"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            {catLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading categories...</span>
              </div>
            ) : (
              <Select
                value={categoryId || ""}
                onValueChange={(val) => setCategoryId(val || null)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">None</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting || !title.trim()}>
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{task ? "Updating..." : "Creating..."}</>
            ) : task ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
