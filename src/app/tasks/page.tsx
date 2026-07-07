import { TasksClient } from "@/components/tasks-client";
import { getTasks } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const tasks = await getTasks();
  return <TasksClient initial={tasks} />;
}
