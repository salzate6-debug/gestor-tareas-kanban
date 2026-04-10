import { Droppable } from "@hello-pangea/dnd";
import type { Task, ColumnId } from "@/lib/kanban-types";
import TaskCard from "./TaskCard";
import { ClipboardList } from "lucide-react";

const columnStyles: Record<ColumnId, string> = {
  backlog: "bg-column-backlog",
  "in-progress": "bg-column-progress",
  completed: "bg-column-completed",
};

const dotStyles: Record<ColumnId, string> = {
  backlog: "bg-muted-foreground",
  "in-progress": "bg-primary",
  completed: "bg-priority-low",
};

interface Props {
  id: ColumnId;
  title: string;
  tasks: Task[];
  onDelete: (columnId: ColumnId, taskId: string) => void;
}

export default function KanbanColumn({ id, title, tasks, onDelete }: Props) {
  return (
    <div className={`flex flex-col rounded-xl ${columnStyles[id]} p-3 min-h-[200px]`}>
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className={`h-2 w-2 rounded-full ${dotStyles[id]}`} />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="ml-auto rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      <Droppable droppableId={id}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex flex-1 flex-col gap-2.5"
          >
            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <ClipboardList className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-xs">No hay tareas pendientes</p>
              </div>
            )}
            {tasks.map((task, i) => (
              <TaskCard key={task.id} task={task} index={i} columnId={id} onDelete={onDelete} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
