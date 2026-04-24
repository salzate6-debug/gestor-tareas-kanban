import { useState, useEffect, useCallback } from "react";
import type { AppState, Project, Task, ColumnId, Priority, Comment } from "@/lib/kanban-types";
import { createProject, createEmptyBoard } from "@/lib/kanban-types";

const STORAGE_KEY = "pm-app-state";

function getDefaultState(): AppState {
  const personal = createProject("Personal", "🏠");
  const work = createProject("Trabajo", "💼");
  return {
    projects: [personal, work],
    activeProjectId: personal.id,
    theme: "system",
  };
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.projects?.length) return parsed;
    }
  } catch {}
  return getDefaultState();
}

export function useAppState() {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Theme
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    } else {
      root.classList.toggle("dark", state.theme === "dark");
    }
  }, [state.theme]);

  const setTheme = useCallback((theme: AppState["theme"]) => {
    setState((s) => ({ ...s, theme }));
  }, []);

  const activeProject = state.projects.find((p) => p.id === state.activeProjectId) || state.projects[0];

  const setActiveProject = useCallback((id: string) => {
    setState((s) => ({ ...s, activeProjectId: id }));
  }, []);

  const addProject = useCallback((name: string, emoji: string) => {
    const proj = createProject(name, emoji);
    setState((s) => ({
      ...s,
      projects: [...s.projects, proj],
      activeProjectId: proj.id,
    }));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setState((s) => {
      const projects = s.projects.filter((p) => p.id !== id);
      if (!projects.length) {
        const def = createProject("Personal", "🏠");
        return { ...s, projects: [def], activeProjectId: def.id };
      }
      return {
        ...s,
        projects,
        activeProjectId: s.activeProjectId === id ? projects[0].id : s.activeProjectId,
      };
    });
  }, []);

  const updateBoard = useCallback(
    (updater: (board: Record<string, Task[]>) => Record<string, Task[]>) => {
      setState((s) => {
        const proj = s.projects.find((p) => p.id === s.activeProjectId) || s.projects[0];
        if (!proj) return s;
        return {
          ...s,
          projects: s.projects.map((p) =>
            p.id === proj.id ? { ...p, board: updater(p.board) } : p
          ),
        };
      });
    },
    []
  );

  const addTask = useCallback(
    (columnId: ColumnId, title: string, description: string, priority: Priority, tags: string[], dueDate: string | null) => {
      const task: Task = {
        id: crypto.randomUUID(),
        title,
        description,
        priority,
        tags,
        dueDate,
        comments: [],
        subtasks: [],
        createdAt: new Date().toISOString(),
      };
      updateBoard((board) => ({
        ...board,
        [columnId]: [...(board[columnId] || []), task],
      }));
    },
    [updateBoard]
  );

  const deleteTask = useCallback(
    (columnId: ColumnId, taskId: string) => {
      updateBoard((board) => ({
        ...board,
        [columnId]: board[columnId].filter((t) => t.id !== taskId),
      }));
    },
    [updateBoard]
  );

  const updateTask = useCallback(
    (columnId: ColumnId, taskId: string, updates: Partial<Task>) => {
      updateBoard((board) => ({
        ...board,
        [columnId]: board[columnId].map((t) =>
          t.id === taskId ? { ...t, ...updates } : t
        ),
      }));
    },
    [updateBoard]
  );

  const addComment = useCallback(
    (columnId: ColumnId, taskId: string, text: string) => {
      const comment: Comment = {
        id: crypto.randomUUID(),
        text,
        createdAt: new Date().toISOString(),
      };
      updateBoard((board) => ({
        ...board,
        [columnId]: board[columnId].map((t) =>
          t.id === taskId ? { ...t, comments: [...t.comments, comment] } : t
        ),
      }));
    },
    [updateBoard]
  );

  const moveTask = useCallback(
    (taskId: string, sourceCol: string, destCol: string, destIdx: number) => {
      updateBoard((board) => {
        const sourceTasks = [...(board[sourceCol] || [])];
        const taskIndex = sourceTasks.findIndex((t) => t.id === taskId);
        if (taskIndex === -1) return board;

        const [moved] = sourceTasks.splice(taskIndex, 1);

        if (sourceCol === destCol) {
          sourceTasks.splice(destIdx, 0, moved);
          return { ...board, [sourceCol]: sourceTasks };
        }

        const destTasks = [...(board[destCol] || [])];
        destTasks.splice(destIdx, 0, moved);
        return { ...board, [sourceCol]: sourceTasks, [destCol]: destTasks };
      });
    },
    [updateBoard]
  );

  // Progress
  const totalTasks = Object.values(activeProject.board).reduce((sum, col) => sum + col.length, 0);
  const doneTasks = (activeProject.board.done || []).length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return {
    state,
    activeProject,
    setActiveProject,
    addProject,
    deleteProject,
    setTheme,
    addTask,
    deleteTask,
    updateTask,
    addComment,
    moveTask,
    progress,
    totalTasks,
    doneTasks,
  };
}
