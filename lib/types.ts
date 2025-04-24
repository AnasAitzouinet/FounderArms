export type User = {
  id: string
  email: string
  created_at: string
}

export type Category = {
  id: string
  name: string
  color: string
  user_id: string
  created_at: string
}

export type Task = {
  id: string
  title: string
  description: string | null
  is_completed: boolean
  due_date: string | null
  priority: number
  category_id: string | null
  user_id: string
  created_at: string
  category?: Category
}
