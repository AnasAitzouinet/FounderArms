import { createClient } from "@/lib/supabase/server"
import TaskList from "@/components/tasks/task-list"
import type { Task, Category } from "@/lib/types"
import { notFound } from "next/navigation"

interface CategoryPageProps {
  params: {
    id: string
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { id } = await params
  const supabase =await createClient()

  // Fetch category
  const { data: category } = await supabase.from("categories").select("*").eq("id", id).single()

  if (!category) {
    notFound()
  }

  // Fetch tasks for this category
  const { data: tasks } = await supabase
    .from("tasks")
    .select(`
      *,
      category:categories(*)
    `)
    .eq("category_id", id)
    .order("priority")

  // Fetch all categories for the dropdown
  const { data: categories } = await supabase.from("categories").select("*").order("name")

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
        <h1 className="text-2xl font-bold">{category.name}</h1>
      </div>
      <TaskList initialTasks={tasks as Task[]} initialCategories={categories as Category[]} categoryId={id} />
    </div>
  )
}
