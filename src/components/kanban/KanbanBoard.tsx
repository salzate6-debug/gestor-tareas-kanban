import { useState, useMemo } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { useKanban } from "@/hooks/use-kanban";
import { COLUMNS } from "@/lib/kanban-types";
import KanbanColumn from "./KanbanColumn";
import AddTaskDialog from "./AddTaskDialog";
import { Search, LayoutDashboard } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function KanbanBoard() {
  const { board, addTask, deleteTask, moveTask } = useKanban();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return board;
    const result: typeof board = {};
    for (const col of COLUMNS) {
      result[col.id] = board[col.id].filter((t) =>
        t.title.toLowerCase().includes(q)
      );
    }
    return result;
  }, [board, search]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    moveTask(
      result.source.droppableId,
      result.destination.droppableId,
      result.source.index,
      result.destination.index
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-foreground">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold tracking-tight">Kanban Board</h1>
          </div>

          <div className="relative ml-auto max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar tareas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <AddTaskDialog onAdd={addTask} />
        </div>
      </header>

      {/* Board */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid gap-4 md:grid-cols-3">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                tasks={filtered[col.id] || []}
                onDelete={deleteTask}
              />
            ))}
          </div>
        </DragDropContext>
      </main>
    </div>
  );
}
