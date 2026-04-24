import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Calendar, MessageSquare, GripVertical, Brain, CheckSquare } from "lucide-react";
import type { Task, ColumnId } from "@/lib/kanban-types";
import { PRIORITY_CONFIG } from "@/lib/kanban-types";
import { Draggable } from "@hello-pangea/dnd";
import { format, isPast, isToday } from "date-fns";
import CotAssistantDialog from "./CotAssistantDialog";

interface Props {
  task: Task;
  index: number;
  columnId: ColumnId;
  onDelete: (columnId: ColumnId, taskId: string) => void;
  onOpen: (task: Task, columnId: ColumnId) => void;
  onAddSubtasks: (columnId: ColumnId, taskId: string, texts: string[]) => void;
}

export default function TaskCard({ task, index, columnId, onDelete, onOpen, onAddSubtasks }: Props) {
  const p = PRIORITY_CONFIG[task.priority];
  const overdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && columnId !== "done";
  const [cotOpen, setCotOpen] = useState(false);

  const subtasks = task.subtasks || [];
  const doneSubs = subtasks.filter((s) => s.done).length;

  return (
    <>
      <Draggable draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <motion.div
            ref={provided.innerRef}
            {...provided.draggableProps}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className={`group rounded-lg border bg-card p-3 cursor-pointer transition-shadow ${
              snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20" : "hover:shadow-md"
            }`}
            onClick={() => onOpen(task, columnId)}
          >
            <div className="flex items-start gap-2">
              <div
                {...provided.dragHandleProps}
                className="mt-0.5 shrink-0 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
              >
                <GripVertical className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <h4 className="text-sm font-medium text-card-foreground leading-snug truncate">
                    {task.title}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(columnId, task.id);
                    }}
                    className="shrink-0 rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                {task.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {task.description}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${p.colorClass}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${p.dotClass}`} />
                    {p.label}
                  </span>

                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {(task.dueDate || task.comments.length > 0 || subtasks.length > 0) && (
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                    {task.dueDate && (
                      <span className={`flex items-center gap-1 ${overdue ? "text-destructive font-medium" : ""}`}>
                        <Calendar className="h-3 w-3" />
                        {format(new Date(task.dueDate), "MMM d")}
                      </span>
                    )}
                    {task.comments.length > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {task.comments.length}
                      </span>
                    )}
                    {subtasks.length > 0 && (
                      <span className="flex items-center gap-1">
                        <CheckSquare className="h-3 w-3" />
                        {doneSubs}/{subtasks.length}
                      </span>
                    )}
                  </div>
                )}

                {/* CoT Action */}
                <div className="mt-2.5 pt-2 border-t border-border/50 flex">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCotOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Brain className="h-3.5 w-3.5" />
                    Planificar Pasos
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </Draggable>

      <CotAssistantDialog
        open={cotOpen}
        onOpenChange={setCotOpen}
        taskTitle={task.title}
        onConvertToSubtasks={(steps) => onAddSubtasks(columnId, task.id, steps)}
      />
    </>
  );
}
