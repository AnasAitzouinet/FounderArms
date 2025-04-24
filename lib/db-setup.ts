import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_PUBLIC_API_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function setupDatabase() {
  // Create categories table
  await supabase.rpc('exec_sql', {
    sql_query: `
    CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`
  })

  // Create tasks table
  await supabase.rpc('exec_sql', {
    sql_query: `
    CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      description TEXT,
      is_completed BOOLEAN DEFAULT FALSE,
      due_date TIMESTAMP WITH TIME ZONE,
      priority INTEGER DEFAULT 0,
      category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`
  })

  // Create RLS policies
  await supabase.rpc('exec_sql', {
    sql_query: `
    -- Categories policies
    CREATE POLICY "Users can create their own categories" 
      ON categories FOR INSERT 
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can view their own categories" 
      ON categories FOR SELECT 
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can update their own categories" 
      ON categories FOR UPDATE 
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own categories" 
      ON categories FOR DELETE 
      USING (auth.uid() = user_id);

    -- Tasks policies
    CREATE POLICY "Users can create their own tasks" 
      ON tasks FOR INSERT 
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can view their own tasks" 
      ON tasks FOR SELECT 
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can update their own tasks" 
      ON tasks FOR UPDATE 
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own tasks" 
      ON tasks FOR DELETE 
      USING (auth.uid() = user_id);`
  })

  console.log("Database setup complete")
}
