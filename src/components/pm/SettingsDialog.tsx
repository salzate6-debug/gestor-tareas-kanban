import { useState } from "react";
import { Settings, User, Bell, Palette, Trash2, Mail, LogOut, Loader2, Sun, Moon, Monitor } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

interface Preferences {
  theme: "light" | "dark" | "system";
  notify_email: boolean;
  notify_due_dates: boolean;
  notify_comments: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: { display_name: string; avatar_url: string | null };
  preferences: Preferences;
  onUpdateProfile: (name: string) => Promise<void> | void;
  onUpdatePreferences: (patch: Partial<Preferences>) => Promise<void> | void;
  onDeleteAccount: () => Promise<void> | void;
}

export default function SettingsDialog({
  open,
  onOpenChange,
  profile,
  preferences,
  onUpdateProfile,
  onUpdatePreferences,
  onDeleteAccount,
}: Props) {
  const { user, signOut } = useAuth();
  const [name, setName] = useState(profile.display_name);
  const [savingName, setSavingName] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSaveName = async () => {
    if (!name.trim() || name === profile.display_name) return;
    setSavingName(true);
    await onUpdateProfile(name.trim());
    setSavingName(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDeleteAccount();
    setDeleting(false);
  };

  const themes: { value: Preferences["theme"]; label: string; Icon: any }[] = [
    { value: "light", label: "Claro", Icon: Sun },
    { value: "dark", label: "Oscuro", Icon: Moon },
    { value: "system", label: "Sistema", Icon: Monitor },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </DialogTitle>
          <DialogDescription>Administra tu cuenta, apariencia y notificaciones.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="account" className="mt-2">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="account" className="gap-1.5"><User className="h-3.5 w-3.5" />Cuenta</TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1.5"><Palette className="h-3.5 w-3.5" />Apariencia</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5"><Bell className="h-3.5 w-3.5" />Notif.</TabsTrigger>
          </TabsList>

          {/* Account */}
          <TabsContent value="account" className="space-y-5 mt-5">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Nombre de perfil</Label>
              <div className="flex gap-2">
                <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
                <Button onClick={handleSaveName} disabled={savingName || !name.trim() || name === profile.display_name}>
                  {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />Correo electrónico</Label>
              <Input value={user?.email ?? ""} disabled className="bg-muted" />
              <p className="text-[11px] text-muted-foreground">El correo no se puede modificar.</p>
            </div>

            <div className="border-t pt-4">
              <Button variant="outline" className="w-full gap-2" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>

            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-destructive flex items-center gap-1.5">
                <Trash2 className="h-3.5 w-3.5" />
                Zona peligrosa
              </h3>
              <p className="text-xs text-muted-foreground">
                Eliminar tu cuenta borrará todos tus proyectos, tareas y comentarios. Esta acción no se puede deshacer.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-1.5">
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar cuenta
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar tu cuenta?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se borrarán de forma permanente tu perfil, proyectos, tareas, comentarios y subtareas. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sí, eliminar todo"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TabsContent>

          {/* Appearance */}
          <TabsContent value="appearance" className="space-y-5 mt-5">
            <div>
              <Label className="mb-2 block">Tema</Label>
              <div className="grid grid-cols-3 gap-2">
                {themes.map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    onClick={() => onUpdatePreferences({ theme: value })}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-colors ${
                      preferences.theme === value
                        ? "border-primary bg-primary/5 text-primary"
                        : "hover:bg-accent"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-3 mt-5">
            <NotifRow
              title="Alertas por correo"
              desc="Recibe resúmenes y avisos importantes en tu correo."
              checked={preferences.notify_email}
              onChange={(v) => onUpdatePreferences({ notify_email: v })}
            />
            <NotifRow
              title="Recordatorios de fechas"
              desc="Avisos cuando una tarea se acerque a su fecha de vencimiento."
              checked={preferences.notify_due_dates}
              onChange={(v) => onUpdatePreferences({ notify_due_dates: v })}
            />
            <NotifRow
              title="Comentarios y menciones"
              desc="Notifícame cuando haya nuevos comentarios en mis tareas."
              checked={preferences.notify_comments}
              onChange={(v) => onUpdatePreferences({ notify_comments: v })}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function NotifRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
