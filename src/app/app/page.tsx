import { TaskList } from "@/components/tasks/task-list"

export default function Home() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <TaskList />
    </div>
  )
}
