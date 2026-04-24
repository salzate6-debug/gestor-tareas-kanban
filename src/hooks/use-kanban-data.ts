import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Task, Project, ColumnId, Priority, Comment, Subtask, BoardData, AppState } from "@/lib/kanban-types";
import { COLUMNS, createEmptyBoard } from "@/lib/kanban-types";
import { toast } from "@/hooks/use-toast";

type ThemePref = "light" | "dark" | "system";

interface Preferences {
  theme: ThemePref;
  notify_email: boolean;
  notify_due_dates: boolean;
  notify_comments: boolean;
}

function rowToTask(row: any, comments: any[], subs: any[]): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    priority: (row.priority ?? "none") as Priority,
    tags: row.tags ?? [],
    dueDate: row.due_date,
    createdAt: row.created_at,
    comments: comments
      .filter((c) => c.task_id === row.id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map<Comment>((c) => ({ id: c.id, text: c.text, createdAt: c.created_at })),
    subtasks: subs
      .filter((s) => s.task_id === row.id)
      .sort((a, b) => a.position - b.position)
      .map<Subtask>((s) => ({ id: s.id, text: s.text, done: s.done })),
  };
}

export function useKanbanData() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [preferences, setPreferences] = useState<Preferences>({
    theme: "system",
    notify_email: true,
    notify_due_dates: true,
    notify_comments: true,
  });
  const [profile, setProfile] = useState<{ display_name: string; avatar_url: string | null }>({
    display_name: "",
    avatar_url: null,
  });
  const [loading, setLoading] = useState(true);

  // ========= Theme application =========
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      if (preferences.theme === "system") {
        root.classList.toggle("dark", window.matchMedia("(prefers-color-scheme: dark)").matches);
      } else {
        root.classList.toggle("dark", preferences.theme === "dark");
      }
    };
    apply();
    if (preferences.theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [preferences.theme]);

  // ========= Initial load =========
  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [profRes, prefRes, projRes] = await Promise.all([
      supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).maybeSingle(),
      supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("projects").select("*").eq("user_id", user.id).order("position"),
    ]);

    if (profRes.data) setProfile({ display_name: profRes.data.display_name ?? "", avatar_url: profRes.data.avatar_url });
    if (prefRes.data) setPreferences({
      theme: prefRes.data.theme as ThemePref,
      notify_email: prefRes.data.notify_email,
      notify_due_dates: prefRes.data.notify_due_dates,
      notify_comments: prefRes.data.notify_comments,
    });

    const projectRows = projRes.data ?? [];
    const projectIds = projectRows.map((p) => p.id);

    let tasksRows: any[] = [];
    let commentsRows: any[] = [];
    let subRows: any[] = [];

    if (projectIds.length) {
      const { data: t } = await supabase
        .from("tasks")
        .select("*")
        .in("project_id", projectIds)
        .order("position");
      tasksRows = t ?? [];
      const taskIds = tasksRows.map((t) => t.id);
      if (taskIds.length) {
        const [c, s] = await Promise.all([
          supabase.from("task_comments").select("*").in("task_id", taskIds),
          supabase.from("task_subtasks").select("*").in("task_id", taskIds),
        ]);
        commentsRows = c.data ?? [];
        subRows = s.data ?? [];
      }
    }

    const builtProjects: Project[] = projectRows.map((pr) => {
      const board: BoardData = createEmptyBoard();
      tasksRows
        .filter((t) => t.project_id === pr.id)
        .forEach((t) => {
          const col = (board[t.column_id as ColumnId] ||= []);
          col.push(rowToTask(t, commentsRows, subRows));
        });
      return {
        id: pr.id,
        name: pr.name,
        emoji: pr.emoji,
        board,
        createdAt: pr.created_at,
      };
    });

    setProjects(builtProjects);
    setActiveProjectId((cur) => {
      if (cur && builtProjects.find((p) => p.id === cur)) return cur;
      return builtProjects[0]?.id ?? "";
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) loadAll();
  }, [user, loadAll]);

  // Local mutation helper for active project board
  const mutateActiveBoard = useCallback(
    (updater: (board: BoardData) => BoardData) => {
      setProjects((prev) =>
        prev.map((p) => (p.id === activeProjectId ? { ...p, board: updater(p.board) } : p))
      );
    },
    [activeProjectId]
  );

  const activeProject =
    projects.find((p) => p.id === activeProjectId) ||
    projects[0] ||
    { id: "", name: "", emoji: "", board: createEmptyBoard(), createdAt: "" };

  // ========= Projects =========
  const addProject = useCallback(
    async (name: string, emoji: string) => {
      if (!user) return;
      const position = projects.length;
      const { data, error } = await supabase
        .from("projects")
        .insert({ user_id: user.id, name, emoji, position })
        .select()
        .single();
      if (error || !data) return toast({ title: "Error", description: error?.message, variant: "destructive" });
      setProjects((prev) => [
        ...prev,
        { id: data.id, name: data.name, emoji: data.emoji, board: createEmptyBoard(), createdAt: data.created_at },
      ]);
      setActiveProjectId(data.id);
    },
    [user, projects.length]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      if (projects.length <= 1) return toast({ title: "No se puede eliminar", description: "Debe existir al menos un proyecto." });
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (activeProjectId === id) {
        const next = projects.find((p) => p.id !== id);
        if (next) setActiveProjectId(next.id);
      }
    },
    [projects, activeProjectId]
  );

  // ========= Tasks =========
  const addTask = useCallback(
    async (
      columnId: ColumnId,
      title: string,
      description: string,
      priority: Priority,
      tags: string[],
      dueDate: string | null
    ) => {
      if (!user || !activeProjectId) return;
      const position = (activeProject.board[columnId] || []).length;
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: user.id,
          project_id: activeProjectId,
          column_id: columnId,
          position,
          title,
          description,
          priority,
          tags,
          due_date: dueDate,
        })
        .select()
        .single();
      if (error || !data) return toast({ title: "Error", description: error?.message, variant: "destructive" });
      mutateActiveBoard((board) => ({
        ...board,
        [columnId]: [
          ...(board[columnId] || []),
          rowToTask(data, [], []),
        ],
      }));
    },
    [user, activeProjectId, activeProject.board, mutateActiveBoard]
  );

  const deleteTask = useCallback(
    async (columnId: ColumnId, taskId: string) => {
      mutateActiveBoard((board) => ({
        ...board,
        [columnId]: (board[columnId] || []).filter((t) => t.id !== taskId),
      }));
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    },
    [mutateActiveBoard]
  );

  const updateTask = useCallback(
    async (columnId: ColumnId, taskId: string, updates: Partial<Task>) => {
      mutateActiveBoard((board) => ({
        ...board,
        [columnId]: (board[columnId] || []).map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
      }));
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (Object.keys(dbUpdates).length === 0) return;
      const { error } = await supabase.from("tasks").update(dbUpdates).eq("id", taskId);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    },
    [mutateActiveBoard]
  );

  const moveTask = useCallback(
    async (taskId: string, sourceCol: string, destCol: string, destIdx: number) => {
      let movedSnapshot: { srcCol: ColumnId; destCol: ColumnId; newDest: Task[] } | null = null;
      mutateActiveBoard((board) => {
        const sourceTasks = [...(board[sourceCol] || [])];
        const idx = sourceTasks.findIndex((t) => t.id === taskId);
        if (idx === -1) return board;
        const [moved] = sourceTasks.splice(idx, 1);
        if (sourceCol === destCol) {
          sourceTasks.splice(destIdx, 0, moved);
          movedSnapshot = { srcCol: sourceCol as ColumnId, destCol: destCol as ColumnId, newDest: sourceTasks };
          return { ...board, [sourceCol]: sourceTasks };
        }
        const destTasks = [...(board[destCol] || [])];
        destTasks.splice(destIdx, 0, moved);
        movedSnapshot = { srcCol: sourceCol as ColumnId, destCol: destCol as ColumnId, newDest: destTasks };
        return { ...board, [sourceCol]: sourceTasks, [destCol]: destTasks };
      });

      // Persist: update column + position of moved task and reindex destination
      const { error } = await supabase
        .from("tasks")
        .update({ column_id: destCol, position: destIdx })
        .eq("id", taskId);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      // Reindex positions for destination column (best-effort, non-blocking)
      if (movedSnapshot) {
        const updates = movedSnapshot.newDest.map((t, i) =>
          supabase.from("tasks").update({ position: i }).eq("id", t.id)
        );
        await Promise.all(updates);
      }
    },
    [mutateActiveBoard]
  );

  // ========= Comments =========
  const addComment = useCallback(
    async (columnId: ColumnId, taskId: string, text: string) => {
      if (!user) return;
      const { data, error } = await supabase
        .from("task_comments")
        .insert({ user_id: user.id, task_id: taskId, text })
        .select()
        .single();
      if (error || !data) return toast({ title: "Error", description: error?.message, variant: "destructive" });
      mutateActiveBoard((board) => ({
        ...board,
        [columnId]: (board[columnId] || []).map((t) =>
          t.id === taskId
            ? { ...t, comments: [...t.comments, { id: data.id, text: data.text, createdAt: data.created_at }] }
            : t
        ),
      }));
    },
    [user, mutateActiveBoard]
  );

  // ========= Subtasks =========
  const addSubtasks = useCallback(
    async (columnId: ColumnId, taskId: string, texts: string[]) => {
      if (!user) return;
      const task = (activeProject.board[columnId] || []).find((t) => t.id === taskId);
      const basePos = (task?.subtasks?.length ?? 0);
      const rows = texts.map((text, i) => ({
        user_id: user.id,
        task_id: taskId,
        text,
        position: basePos + i,
      }));
      const { data, error } = await supabase.from("task_subtasks").insert(rows).select();
      if (error || !data) return toast({ title: "Error", description: error?.message, variant: "destructive" });
      const newSubs: Subtask[] = data.map((s) => ({ id: s.id, text: s.text, done: s.done }));
      mutateActiveBoard((board) => ({
        ...board,
        [columnId]: (board[columnId] || []).map((t) =>
          t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), ...newSubs] } : t
        ),
      }));
    },
    [user, activeProject.board, mutateActiveBoard]
  );

  const toggleSubtask = useCallback(
    async (columnId: ColumnId, taskId: string, subtaskId: string) => {
      let newDone = false;
      mutateActiveBoard((board) => ({
        ...board,
        [columnId]: (board[columnId] || []).map((t) =>
          t.id === taskId
            ? {
                ...t,
                subtasks: t.subtasks.map((s) => {
                  if (s.id === subtaskId) {
                    newDone = !s.done;
                    return { ...s, done: !s.done };
                  }
                  return s;
                }),
              }
            : t
        ),
      }));
      const { error } = await supabase.from("task_subtasks").update({ done: newDone }).eq("id", subtaskId);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    },
    [mutateActiveBoard]
  );

  const deleteSubtask = useCallback(
    async (columnId: ColumnId, taskId: string, subtaskId: string) => {
      mutateActiveBoard((board) => ({
        ...board,
        [columnId]: (board[columnId] || []).map((t) =>
          t.id === taskId ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) } : t
        ),
      }));
      const { error } = await supabase.from("task_subtasks").delete().eq("id", subtaskId);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    },
    [mutateActiveBoard]
  );

  // ========= Profile & Preferences =========
  const updateProfile = useCallback(
    async (displayName: string) => {
      if (!user) return;
      const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", user.id);
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
      setProfile((p) => ({ ...p, display_name: displayName }));
      toast({ title: "Perfil actualizado" });
    },
    [user]
  );

  const updatePreferences = useCallback(
    async (patch: Partial<Preferences>) => {
      if (!user) return;
      const next = { ...preferences, ...patch };
      setPreferences(next);
      const { error } = await supabase
        .from("user_preferences")
        .upsert({ user_id: user.id, ...next }, { onConflict: "user_id" });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    },
    [user, preferences]
  );

  const setTheme = useCallback(
    (theme: ThemePref) => updatePreferences({ theme }),
    [updatePreferences]
  );

  const deleteAccount = useCallback(async () => {
    if (!user) return;
    // Delete all user data (profile/projects cascade due to FK)
    // auth.users row remains but with no app data; user can be removed by admin.
    await supabase.from("profiles").delete().eq("id", user.id);
    await supabase.auth.signOut();
    toast({ title: "Cuenta eliminada", description: "Todos tus datos han sido borrados." });
  }, [user]);

  // ========= Progress =========
  const totalTasks = useMemo(
    () => Object.values(activeProject.board).reduce((s, c) => s + c.length, 0),
    [activeProject.board]
  );
  const doneTasks = (activeProject.board.done || []).length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Build a state-shape compatible with original AppState consumers
  const state: AppState = {
    projects,
    activeProjectId,
    theme: preferences.theme,
  };

  return {
    state,
    loading,
    activeProject,
    profile,
    preferences,
    setActiveProject: setActiveProjectId,
    addProject,
    deleteProject,
    setTheme,
    updatePreferences,
    updateProfile,
    deleteAccount,
    addTask,
    deleteTask,
    updateTask,
    moveTask,
    addComment,
    addSubtasks,
    toggleSubtask,
    deleteSubtask,
    progress,
    totalTasks,
    doneTasks,
  };
}
