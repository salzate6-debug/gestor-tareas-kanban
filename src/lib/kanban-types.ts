export type Priority = "urgent" | "high" | "medium" | "low" | "none";

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
}

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  tags: string[];
  dueDate: string | null;
  comments: Comment[];
  subtasks: Subtask[];
  createdAt: string;
}

export type ColumnId = "backlog" | "todo" | "in-progress" | "done";

export interface Column {
  id: ColumnId;
  title: string;
}

export const COLUMNS: Column[] = [
  { id: "backlog", title: "Pendiente" },
  { id: "todo", title: "Por Hacer" },
  { id: "in-progress", title: "En Progreso" },
  { id: "done", title: "Completado" },
];

export interface BoardData {
  [key: string]: Task[];
}

export interface Project {
  id: string;
  name: string;
  emoji: string;
  board: BoardData;
  createdAt: string;
}

export interface AppState {
  projects: Project[];
  activeProjectId: string;
  theme: "light" | "dark" | "system";
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; colorClass: string; dotClass: string }> = {
  urgent: { label: "Urgente", colorClass: "bg-priority-urgent/15 text-priority-urgent", dotClass: "bg-priority-urgent" },
  high: { label: "Alta", colorClass: "bg-priority-high/15 text-priority-high", dotClass: "bg-priority-high" },
  medium: { label: "Media", colorClass: "bg-priority-medium/15 text-priority-medium", dotClass: "bg-priority-medium" },
  low: { label: "Baja", colorClass: "bg-priority-low/15 text-priority-low", dotClass: "bg-priority-low" },
  none: { label: "Ninguna", colorClass: "bg-priority-none/15 text-priority-none", dotClass: "bg-priority-none" },
};

export function createEmptyBoard(): BoardData {
  return {
    backlog: [],
    todo: [],
    "in-progress": [],
    done: [],
  };
}

export function createProject(name: string, emoji: string): Project {
  return {
    id: crypto.randomUUID(),
    name,
    emoji,
    board: createEmptyBoard(),
    createdAt: new Date().toISOString(),
  };
}
