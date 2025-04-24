import { createClient } from "@/lib/supabase/server"
import TaskList from "@/components/tasks/task-list"
import type { Task, Category } from "@/lib/types"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch tasks with categories
  const { data: tasks } = await supabase
    .from("tasks")
    .select(`
      *,
      category:categories(*)
    `)
    .order("priority")

  // Fetch categories
  const { data: categories } = await supabase.from("categories").select("*").order("name")

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <TaskList initialTasks={tasks as Task[]} initialCategories={categories as Category[]} />
    </div>
  )
}
