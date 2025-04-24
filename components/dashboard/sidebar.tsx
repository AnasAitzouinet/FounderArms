"use client"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Home, ListTodo, Calendar } from "lucide-react"
import { toast } from "sonner"
import type { Category } from "@/lib/types"

// 1) Memoize your Supabase client so it's stable across renders
function useSupabase() {
  return useMemo(() => createClient(), [])
}

// 2) SWR fetcher + real-time subscription hook
function useCategories(supabase: ReturnType<typeof createClient>) {
  const fetcher = async () => {
    const { data, error } = await supabase.from("categories").select("*").order("name")
    if (error) throw error
    return data
  }

  const { data, error, mutate } = useSWR<Category[]>("categories", fetcher)

  useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel("categories")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => {
          // revalidate on any change
          mutate()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, mutate])

  return {
    categories: data ?? [],
    isLoading: !data && !error,
    error,
    mutate,
  }
}

// 3) A small form-inside-dialog for creating a category
function NewCategoryDialog({
  open,
  onOpenChange,
  onCreate,
  isSubmitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string, color: string) => Promise<void>
  isSubmitting: boolean
}) {
  const [name, setName] = useState("")
  const [color, setColor] = useState("#3b82f6")

  const handleSubmit = async () => {
    if (!name.trim()) return
    await onCreate(name.trim(), color)
    setName("")
    setColor("#3b82f6")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add category</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new category</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-8 p-1"
              />
              <span className="text-sm">{color}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function Sidebar() {
  const supabase = useSupabase()
  const pathname = usePathname()
  const { categories, isLoading, mutate } = useCategories(supabase)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 4) Handler for inserting & revalidating
  const handleCreateCategory = async (name: string, color: string) => {
    setIsSubmitting(true)

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      toast.error("Not authenticated")
      setIsSubmitting(false)
      return
    }

    const userId = session.user.id

    const { error } = await supabase
      .from("categories")
      .insert([
        {
          name,
          color,
          user_id: userId,
        },
      ])

    setIsSubmitting(false)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Category created")
      mutate()   // re-fetch the list
    }
  }

  return (
    <div className="hidden border-r bg-background md:block w-64">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <ListTodo className="h-6 w-6" />
          <span>TaskMaster</span>
        </Link>
      </div>

      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="px-3 py-2 space-y-4">
      
      
          {/* Categories */}
          <div>
            <div className="flex justify-between items-center px-2">
              <h2 className="text-lg font-semibold">Categories</h2>
              <NewCategoryDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onCreate={handleCreateCategory}
                isSubmitting={isSubmitting}
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2 py-1">
                No categories yet
              </p>
            ) : (
              <div className="space-y-1 mt-2">
                {categories.map((cat) => (
                  <Link key={cat.id} href={`/dashboard/category/${cat.id}`}>
                    <Button
                      variant={
                        pathname === `/dashboard/category/${cat.id}`
                          ? "secondary"
                          : "ghost"
                      }
                      size="sm"
                      className="w-full justify-start"
                    >
                      <span
                        className="mr-2 h-3 w-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
