# Personal Task Management App

A comprehensive task management application built with Next.js and Supabase, featuring drag-and-drop functionality, category management, and responsive design.

## Features

- User authentication with Supabase Auth
- Task creation, editing, and deletion
- Category assignment for tasks
- Task prioritization via drag-and-drop
- Filtering of tasks by status and category
- Calendar view for due dates
- Responsive design for mobile and desktop

## Tech Stack

- **Frontend**: Next.js 15 with App Router, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Drag and Drop**: dnd-kit library

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn
- Supabase account

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_PRIVATE_API_KEY=your_supabase_service_role_key
\`\`\`

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`
3. Run the development server:
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The application uses the following database schema:

### Users Table
- Managed by Supabase Auth

### Categories Table
- `id`: UUID (Primary Key)
- `name`: Text
- `color`: Text
- `user_id`: UUID (Foreign Key to auth.users)
- `created_at`: Timestamp

### Tasks Table
- `id`: UUID (Primary Key)
- `title`: Text
- `description`: Text (Optional)
- `is_completed`: Boolean
- `due_date`: Timestamp (Optional)
- `priority`: Integer
- `category_id`: UUID (Foreign Key to categories)
- `user_id`: UUID (Foreign Key to auth.users)
- `created_at`: Timestamp

## Implementation Decisions

### Frontend Architecture
- Used Server Components for initial data fetching
- Used Client Components for interactive elements
- Implemented responsive design with Tailwind CSS
- Used shadcn/ui for consistent UI components

### Backend Architecture
- Leveraged Next.js App Router for routing
- Used Supabase for authentication and data storage
- Implemented Row Level Security for data protection
- Created Server Actions for data mutations

### State Management
- Used React's built-in state management with useState and useEffect
- Implemented optimistic updates for better UX
- Used Supabase real-time subscriptions for live updates

### Error Handling
- Implemented proper error states in forms
- Added loading indicators for async operations
- Used try/catch blocks for error handling

## License

This project is licensed under the MIT License.
