import { Draggable } from "@hello-pangea/dnd";
import type { Task, ColumnId } from "@/lib/kanban-types";
import { Trash2 } from "lucide-react";

const priorityConfig = {
  high: { label: "High", className: "bg-priority-high/15 text-priority-high" },
  medium: { label: "Medium", className: "bg-priority-medium/15 text-priority-medium" },
  low: { label: "Low", className: "bg-priority-low/15 text-priority-low" },
};

interface Props {
  task: Task;
  index: number;
  columnId: ColumnId;
  onDelete: (columnId: ColumnId, taskId: string) => void;
}

export default function TaskCard({ task, index, columnId, onDelete }: Props) {
  const p = priorityConfig[task.priority];

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`group rounded-lg border bg-card p-3.5 shadow-sm transition-shadow ${
            snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20" : "hover:shadow-md"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium text-card-foreground leading-snug">
              {task.title}
            </h4>
            <button
              onClick={() => onDelete(columnId, task.id)}
              className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          {task.description && (
            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="mt-3">
            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${p.className}`}>
              {p.label}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  );
}
