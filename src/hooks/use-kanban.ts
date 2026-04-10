import { useState, useEffect, useCallback } from "react";
import type { BoardState, Task, ColumnId, Priority } from "@/lib/kanban-types";

const STORAGE_KEY = "kanban-board";

const defaultState: BoardState = {
  backlog: [],
  "in-progress": [],
  completed: [],
};

function loadBoard(): BoardState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultState;
}

export function useKanban() {
  const [board, setBoard] = useState<BoardState>(loadBoard);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  }, [board]);

  const addTask = useCallback(
    (columnId: ColumnId, title: string, description: string, priority: Priority) => {
      const task: Task = {
        id: crypto.randomUUID(),
        title,
        description,
        priority,
        createdAt: new Date().toISOString(),
      };
      setBoard((prev) => ({
        ...prev,
        [columnId]: [...prev[columnId], task],
      }));
    },
    []
  );

  const deleteTask = useCallback((columnId: ColumnId, taskId: string) => {
    setBoard((prev) => ({
      ...prev,
      [columnId]: prev[columnId].filter((t) => t.id !== taskId),
    }));
  }, []);

  const moveTask = useCallback(
    (sourceCol: string, destCol: string, sourceIdx: number, destIdx: number) => {
      setBoard((prev) => {
        const sourceTasks = [...prev[sourceCol]];
        const destTasks = sourceCol === destCol ? sourceTasks : [...prev[destCol]];
        const [moved] = sourceTasks.splice(sourceIdx, 1);
        destTasks.splice(destIdx, 0, moved);
        return {
          ...prev,
          [sourceCol]: sourceTasks,
          [destCol]: destTasks,
        };
      });
    },
    []
  );

  return { board, addTask, deleteTask, moveTask };
}
