import { useState } from "react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, MessageSquare, Send, Tag, X, Brain, CheckSquare, Square, Trash2 } from "lucide-react";
import type { Task, ColumnId, Priority } from "@/lib/kanban-types";
import { PRIORITY_CONFIG } from "@/lib/kanban-types";
import CotAssistantDialog from "./CotAssistantDialog";

interface Props {
  task: Task | null;
  columnId: ColumnId | null;
  onClose: () => void;
  onUpdate: (columnId: ColumnId, taskId: string, updates: Partial<Task>) => void;
  onAddComment: (columnId: ColumnId, taskId: string, text: string) => void;
  onAddSubtasks: (columnId: ColumnId, taskId: string, texts: string[]) => void;
  onToggleSubtask: (columnId: ColumnId, taskId: string, subtaskId: string) => void;
  onDeleteSubtask: (columnId: ColumnId, taskId: string, subtaskId: string) => void;
}

export default function TaskDetailSheet({ task, columnId, onClose, onUpdate, onAddComment, onAddSubtasks, onToggleSubtask, onDeleteSubtask }: Props) {
  const [commentText, setCommentText] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [cotOpen, setCotOpen] = useState(false);

  if (!task || !columnId) return null;

  const p = PRIORITY_CONFIG[task.priority];
  const subtasks = task.subtasks || [];

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    onAddComment(columnId, task.id, commentText.trim());
    setCommentText("");
  };

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !task.tags.includes(t)) {
      onUpdate(columnId, task.id, { tags: [...task.tags, t] });
      setTagInput("");
    }
  };

  return (
    <Sheet open={!!task} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto scrollbar-thin">
        <SheetHeader>
          <SheetTitle className="text-left pr-6">{task.title}</SheetTitle>
          <SheetDescription className="text-left">
            Creada el {format(new Date(task.createdAt), "PPP")}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Priority & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Prioridad
              </label>
              <Select
                value={task.priority}
                onValueChange={(v) => onUpdate(columnId, task.id, { priority: v as Priority })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${val.dotClass}`} />
                        {val.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Fecha de Vencimiento
              </label>
              <Input
                type="date"
                className="h-9"
                value={task.dueDate || ""}
                onChange={(e) => onUpdate(columnId, task.id, { dueDate: e.target.value || null })}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
              <Tag className="h-3 w-3" /> Etiquetas
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  {tag}
                  <button
                    onClick={() =>
                      onUpdate(columnId, task.id, { tags: task.tags.filter((t) => t !== tag) })
                    }
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Añadir etiqueta..."
                className="h-8 text-xs"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button variant="secondary" size="sm" className="h-8 text-xs" onClick={handleAddTag}>
                Añadir
              </Button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Descripción
            </label>
            {editingDesc ? (
              <div className="space-y-2">
                <Textarea
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  rows={6}
                  className="text-sm"
                  placeholder="Escribe en Markdown..."
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      onUpdate(columnId, task.id, { description: descDraft });
                      setEditingDesc(false);
                    }}
                  >
                    Guardar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingDesc(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  setDescDraft(task.description);
                  setEditingDesc(true);
                }}
                className="cursor-pointer rounded-lg border bg-surface-2 p-3 text-sm min-h-[60px] hover:border-primary/30 transition-colors prose prose-sm dark:prose-invert max-w-none"
              >
                {task.description ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.description}</ReactMarkdown>
                ) : (
                  <span className="text-muted-foreground italic">Haz clic para añadir descripción...</span>
                )}
              </div>
            )}
          </div>

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <CheckSquare className="h-3 w-3" /> Subtareas ({subtasks.filter((s) => s.done).length}/{subtasks.length})
              </label>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1.5 text-xs text-primary hover:text-primary"
                onClick={() => setCotOpen(true)}
              >
                <Brain className="h-3.5 w-3.5" />
                Planificar Pasos
              </Button>
            </div>
            {subtasks.length === 0 ? (
              <p className="text-xs text-muted-foreground italic px-1">
                Sin subtareas. Usa "Planificar Pasos" para generarlas con CoT.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {subtasks.map((s) => (
                  <li
                    key={s.id}
                    className="group flex items-start gap-2 rounded-md border bg-surface-2 px-2.5 py-2"
                  >
                    <button
                      onClick={() => onToggleSubtask(columnId, task.id, s.id)}
                      className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {s.done ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                    <span
                      className={`flex-1 text-sm leading-snug ${
                        s.done ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {s.text}
                    </span>
                    <button
                      onClick={() => onDeleteSubtask(columnId, task.id, s.id)}
                      className="shrink-0 rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Comments */}
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
              <MessageSquare className="h-3 w-3" /> Comentarios ({task.comments.length})
            </label>
            <div className="space-y-3 mb-3">
              {task.comments.map((c) => (
                <div key={c.id} className="rounded-lg bg-surface-2 p-3">
                  <p className="text-sm text-foreground">{c.text}</p>
                  <time className="text-[10px] text-muted-foreground mt-1 block">
                    {format(new Date(c.createdAt), "PPp")}
                  </time>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Escribe un comentario..."
                className="h-9 text-sm"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <Button size="sm" className="h-9 px-3" onClick={handleAddComment} disabled={!commentText.trim()}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>

      <CotAssistantDialog
        open={cotOpen}
        onOpenChange={setCotOpen}
        taskTitle={task.title}
        onConvertToSubtasks={(steps) => onAddSubtasks(columnId, task.id, steps)}
      />
    </Sheet>
  );
}
