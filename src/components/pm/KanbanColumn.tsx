import { Droppable } from "@hello-pangea/dnd";
import { AnimatePresence } from "framer-motion";
import type { Task, ColumnId } from "@/lib/kanban-types";
import TaskCard from "./TaskCard";
import { ClipboardList } from "lucide-react";

const dotColors: Record<ColumnId, string> = {
  backlog: "bg-muted-foreground",
  todo: "bg-primary",
  "in-progress": "bg-priority-medium",
  done: "bg-priority-low",
};

interface Props {
  id: ColumnId;
  title: string;
  tasks: Task[];
  onDelete: (columnId: ColumnId, taskId: string) => void;
  onOpenTask: (task: Task, columnId: ColumnId) => void;
}

export default function KanbanColumn({ id, title, tasks, onDelete, onOpenTask }: Props) {
  return (
    <div className="flex flex-col rounded-xl bg-surface-2 p-2.5 min-h-[250px]">
      <div className="mb-2.5 flex items-center gap-2 px-1.5 py-1">
        <span className={`h-2 w-2 rounded-full ${dotColors[id]}`} />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
        <span className="ml-auto rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-1 flex-col gap-2 rounded-lg p-1 transition-colors ${
              snapshot.isDraggingOver ? "bg-primary/5" : ""
            }`}
          >
            <AnimatePresence mode="popLayout">
              {tasks.length === 0 && !snapshot.isDraggingOver && (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <ClipboardList className="h-7 w-7 mb-1.5 opacity-30" />
                  <p className="text-[11px]">No tasks yet</p>
                </div>
              )}
              {tasks.map((task, i) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={i}
                  columnId={id}
                  onDelete={onDelete}
                  onOpen={onOpenTask}
                />
              ))}
            </AnimatePresence>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
