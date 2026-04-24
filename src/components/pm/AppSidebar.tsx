import { useState } from "react";
import {
  PanelLeftClose,
  PanelLeft,
  Plus,
  Trash2,
  Sun,
  Moon,
  Monitor,
  FolderKanban,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Project, AppState } from "@/lib/kanban-types";
import { cn } from "@/lib/utils";

const EMOJIS = ["🏠", "💼", "🚀", "📚", "🎯", "💡", "🔧", "🎨", "📱", "🌍"];

interface Props {
  projects: Project[];
  activeProjectId: string;
  theme: AppState["theme"];
  profile: { display_name: string; avatar_url: string | null };
  onSelectProject: (id: string) => void;
  onAddProject: (name: string, emoji: string) => void;
  onDeleteProject: (id: string) => void;
  onSetTheme: (theme: AppState["theme"]) => void;
  onOpenSettings: () => void;
}

export default function AppSidebar({
  projects,
  activeProjectId,
  theme,
  profile,
  onSelectProject,
  onAddProject,
  onDeleteProject,
  onSetTheme,
  onOpenSettings,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🚀");

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAddProject(newName.trim(), newEmoji);
    setNewName("");
    setNewEmoji("🚀");
    setDialogOpen(false);
  };

  const themeIcon =
    theme === "dark" ? <Moon className="h-4 w-4" /> : theme === "light" ? <Sun className="h-4 w-4" /> : <Monitor className="h-4 w-4" />;
  const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";

  const initials = (profile.display_name || "?")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-sidebar transition-all duration-200 shrink-0",
        collapsed ? "w-14" : "w-60"
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-3">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold text-foreground tracking-tight">Proyectos</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      {/* Project List */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-0.5">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelectProject(p.id)}
            className={cn(
              "group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
              p.id === activeProjectId
                ? "bg-accent text-accent-foreground font-medium"
                : "text-sidebar-foreground hover:bg-accent/50"
            )}
          >
            <span className="text-base shrink-0">{p.emoji}</span>
            {!collapsed && (
              <>
                <span className="truncate flex-1 text-left">{p.name}</span>
                {projects.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(p.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-destructive/10 hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t p-2 space-y-1">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className={cn("w-full justify-start gap-2", collapsed && "justify-center px-0")}>
              <Plus className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Nuevo Proyecto</span>}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Crear Proyecto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setNewEmoji(e)}
                    className={cn(
                      "h-9 w-9 rounded-md text-lg transition-colors",
                      e === newEmoji ? "bg-primary/15 ring-2 ring-primary" : "hover:bg-accent"
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <Input
                placeholder="Nombre del proyecto"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                autoFocus
              />
              <Button onClick={handleAdd} className="w-full" disabled={!newName.trim()}>
                Crear
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          variant="ghost"
          size="sm"
          className={cn("w-full justify-start gap-2", collapsed && "justify-center px-0")}
          onClick={() => onSetTheme(nextTheme)}
          title="Cambiar tema rápido"
        >
          {themeIcon}
          {!collapsed && <span className="capitalize">{theme === "light" ? "Claro" : theme === "dark" ? "Oscuro" : "Sistema"}</span>}
        </Button>

        {/* Profile / Settings */}
        <button
          onClick={onOpenSettings}
          className={cn(
            "mt-1 flex w-full items-center gap-2 rounded-md p-1.5 text-left transition-colors hover:bg-accent",
            collapsed && "justify-center"
          )}
          title="Configuración"
        >
          <Avatar className="h-7 w-7 shrink-0">
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.display_name} />}
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <span className="flex-1 truncate text-xs font-medium text-foreground">
                {profile.display_name || "Mi cuenta"}
              </span>
              <Settings className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
