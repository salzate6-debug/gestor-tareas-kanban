import { useState, useMemo } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { Search, LayoutGrid, List, Filter, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useKanbanData } from "@/hooks/use-kanban-data";
import { COLUMNS, PRIORITY_CONFIG } from "@/lib/kanban-types";
import type { Task, ColumnId } from "@/lib/kanban-types";
import AppSidebar from "./AppSidebar";
import KanbanColumn from "./KanbanColumn";
import ListView from "./ListView";
import AddTaskDialog from "./AddTaskDialog";
import TaskDetailSheet from "./TaskDetailSheet";
import SettingsDialog from "./SettingsDialog";

type ViewMode = "board" | "list";

export default function ProjectManager() {
  const {
    state,
    loading,
    activeProject,
    profile,
    preferences,
    setActiveProject,
    addProject,
    deleteProject,
    setTheme,
    updatePreferences,
    updateProfile,
    deleteAccount,
    addTask,
    deleteTask,
    updateTask,
    addComment,
    addSubtasks,
    toggleSubtask,
    deleteSubtask,
    moveTask,
    progress,
    totalTasks,
    doneTasks,
  } = useKanbanData();

  const [view, setView] = useState<ViewMode>("board");
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<{ task: Task; columnId: ColumnId } | null>(null);

  // Gather all tags from active project
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    Object.values(activeProject.board).forEach((tasks) =>
      tasks.forEach((t) => t.tags.forEach((tag) => tags.add(tag)))
    );
    return Array.from(tags).sort();
  }, [activeProject.board]);

  // Filter logic
  const filteredBoard = useMemo(() => {
    const q = search.toLowerCase();
    const result: Record<string, Task[]> = {};
    for (const col of COLUMNS) {
      result[col.id] = (activeProject.board[col.id] || []).filter((t) => {
        if (q && !t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
        if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
        if (tagFilter !== "all" && !t.tags.includes(tagFilter)) return false;
        return true;
      });
    }
    return result;
  }, [activeProject.board, search, priorityFilter, tagFilter]);

  // Flat list for list view
  const flatTasks = useMemo(() => {
    const items: { task: Task; columnId: ColumnId }[] = [];
    for (const col of COLUMNS) {
      for (const task of filteredBoard[col.id] || []) {
        items.push({ task, columnId: col.id });
      }
    }
    return items;
  }, [filteredBoard]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    moveTask(
      taskId,
      result.source.droppableId,
      result.destination.droppableId,
      result.destination.index
    );
  };

  const handleOpenTask = (task: Task, columnId: ColumnId) => {
    setSelectedTask({ task, columnId });
  };

  // Re-find the latest task data for the detail sheet
  const latestSelectedTask = useMemo(() => {
    if (!selectedTask) return null;
    const col = activeProject.board[selectedTask.columnId];
    const found = col?.find((t) => t.id === selectedTask.task.id);
    if (found) return { task: found, columnId: selectedTask.columnId };
    // Task may have moved (shouldn't happen from detail view, but just in case)
    for (const c of COLUMNS) {
      const t = activeProject.board[c.id]?.find((t) => t.id === selectedTask.task.id);
      if (t) return { task: t, columnId: c.id };
    }
    return null;
  }, [selectedTask, activeProject.board]);

  const hasFilters = search || priorityFilter !== "all" || tagFilter !== "all";

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar
        projects={state.projects}
        activeProjectId={state.activeProjectId}
        theme={state.theme}
        onSelectProject={setActiveProject}
        onAddProject={addProject}
        onDeleteProject={deleteProject}
        onSetTheme={setTheme}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="shrink-0 border-b bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl">{activeProject.emoji}</span>
              <h1 className="text-base font-bold text-foreground truncate">{activeProject.name}</h1>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* Search */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-48 pl-8 text-xs"
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center rounded-md border bg-surface-2 p-0.5">
                <Button
                  variant={view === "board" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 gap-1"
                  onClick={() => setView("board")}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden md:inline text-xs">Tablero</span>
                </Button>
                <Button
                  variant={view === "list" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 gap-1"
                  onClick={() => setView("list")}
                >
                  <List className="h-3.5 w-3.5" />
                  <span className="hidden md:inline text-xs">Lista</span>
                </Button>
              </div>

              <AddTaskDialog onAdd={addTask} />
            </div>
          </div>

          {/* Filters & Progress */}
          <div className="flex items-center gap-3 px-4 pb-3 sm:px-6 flex-wrap">
            {/* Mobile search */}
            <div className="relative sm:hidden flex-1 min-w-[150px]">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-7 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Prioridades</SelectItem>
                  {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {allTags.length > 0 && (
                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las Etiquetas</SelectItem>
                    {allTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => {
                    setSearch("");
                    setPriorityFilter("all");
                    setTagFilter("all");
                  }}
                >
                  Limpiar
                </Button>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2.5 shrink-0">
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                {doneTasks}/{totalTasks} completadas
              </span>
              <Progress value={progress} className="w-24 h-1.5" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto scrollbar-thin p-4 sm:p-6">
          {view === "board" ? (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 min-h-full">
                {COLUMNS.map((col) => (
                  <KanbanColumn
                    key={col.id}
                    id={col.id}
                    title={col.title}
                    tasks={filteredBoard[col.id] || []}
                    onDelete={deleteTask}
                    onOpenTask={handleOpenTask}
                    onAddSubtasks={addSubtasks}
                  />
                ))}
              </div>
            </DragDropContext>
          ) : (
            <ListView tasks={flatTasks} onDelete={deleteTask} onOpen={handleOpenTask} onAddSubtasks={addSubtasks} />
          )}
        </main>
      </div>

      <TaskDetailSheet
        task={latestSelectedTask?.task || null}
        columnId={latestSelectedTask?.columnId || null}
        onClose={() => setSelectedTask(null)}
        onUpdate={updateTask}
        onAddComment={addComment}
        onAddSubtasks={addSubtasks}
        onToggleSubtask={toggleSubtask}
        onDeleteSubtask={deleteSubtask}
      />
    </div>
  );
}
