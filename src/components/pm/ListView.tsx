import { useState } from "react";
import { motion } from "framer-motion";
import type { Task, ColumnId, Priority } from "@/lib/kanban-types";
import { PRIORITY_CONFIG, COLUMNS } from "@/lib/kanban-types";
import { Trash2, Calendar, MessageSquare, Brain } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import CotAssistantDialog from "./CotAssistantDialog";

interface Props {
  tasks: { task: Task; columnId: ColumnId }[];
  onDelete: (columnId: ColumnId, taskId: string) => void;
  onOpen: (task: Task, columnId: ColumnId) => void;
  onAddSubtasks: (columnId: ColumnId, taskId: string, texts: string[]) => void;
}

export default function ListView({ tasks, onDelete, onOpen, onAddSubtasks }: Props) {
  const [cotTask, setCotTask] = useState<{ task: Task; columnId: ColumnId } | null>(null);
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">No hay tareas que coincidan con los filtros</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-surface-2">
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Título</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Estado</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Prioridad</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Fecha</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Etiquetas</th>
            <th className="px-4 py-2.5 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(({ task, columnId }) => {
            const p = PRIORITY_CONFIG[task.priority];
            const col = COLUMNS.find((c) => c.id === columnId);
            const overdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && columnId !== "done";

            return (
              <motion.tr
                key={task.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b last:border-b-0 hover:bg-accent/50 cursor-pointer transition-colors group"
                onClick={() => onOpen(task, columnId)}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{task.title}</div>
                  {task.description && (
                    <div className="text-xs text-muted-foreground truncate max-w-[300px] mt-0.5">
                      {task.description}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-xs text-muted-foreground">{col?.title}</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.colorClass}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${p.dotClass}`} />
                    {p.label}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {task.dueDate ? (
                    <span className={`text-xs flex items-center gap-1 ${overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                      <Calendar className="h-3 w-3" />
                      {format(new Date(task.dueDate), "MMM d")}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {task.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {tag}
                      </span>
                    ))}
                    {task.tags.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">+{task.tags.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCotTask({ task, columnId });
                      }}
                      title="Planificar Pasos (CoT)"
                      className="rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-primary/10 hover:text-primary transition-opacity"
                    >
                      <Brain className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(columnId, task.id);
                      }}
                      className="rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>

      <CotAssistantDialog
        open={!!cotTask}
        onOpenChange={(open) => !open && setCotTask(null)}
        taskTitle={cotTask?.task.title || ""}
        onConvertToSubtasks={(steps) => {
          if (cotTask) onAddSubtasks(cotTask.columnId, cotTask.task.id, steps);
        }}
      />
    </div>
  );
}
