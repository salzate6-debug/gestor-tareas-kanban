export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  createdAt: string;
}

export type ColumnId = "backlog" | "in-progress" | "completed";

export interface Column {
  id: ColumnId;
  title: string;
}

export const COLUMNS: Column[] = [
  { id: "backlog", title: "Backlog" },
  { id: "in-progress", title: "In Progress" },
  { id: "completed", title: "Completed" },
];

export interface BoardState {
  [key: string]: Task[];
}
