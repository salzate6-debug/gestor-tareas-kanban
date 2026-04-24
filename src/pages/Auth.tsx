import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Loader2, FolderKanban, Mail, Lock, User as UserIcon, Github } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

const emailSchema = z.string().trim().email({ message: "Correo electrónico inválido" }).max(255);
const passwordSchema = z.string().min(6, { message: "Mínimo 6 caracteres" }).max(72);
const nameSchema = z.string().trim().min(1, { message: "Nombre requerido" }).max(60);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6L12 10.2z"/>
  </svg>
);

export default function Auth() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && session) navigate("/", { replace: true });
  }, [session, authLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailParse = emailSchema.safeParse(email);
    const pwdParse = passwordSchema.safeParse(password);
    if (!emailParse.success) return toast({ title: "Error", description: emailParse.error.issues[0].message, variant: "destructive" });
    if (!pwdParse.success) return toast({ title: "Error", description: pwdParse.error.issues[0].message, variant: "destructive" });

    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email: emailParse.data, password });
    setSubmitting(false);
    if (error) {
      const msg = error.message.includes("Invalid login")
        ? "Correo o contraseña incorrectos"
        : error.message;
      return toast({ title: "No se pudo iniciar sesión", description: msg, variant: "destructive" });
    }
    toast({ title: "Bienvenido", description: "Sesión iniciada correctamente." });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameParse = nameSchema.safeParse(displayName);
    const emailParse = emailSchema.safeParse(email);
    const pwdParse = passwordSchema.safeParse(password);
    if (!nameParse.success) return toast({ title: "Error", description: nameParse.error.issues[0].message, variant: "destructive" });
    if (!emailParse.success) return toast({ title: "Error", description: emailParse.error.issues[0].message, variant: "destructive" });
    if (!pwdParse.success) return toast({ title: "Error", description: pwdParse.error.issues[0].message, variant: "destructive" });

    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: emailParse.data,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: nameParse.data },
      },
    });
    setSubmitting(false);
    if (error) {
      const msg = error.message.includes("already registered") || error.message.includes("already been")
        ? "Este correo ya está registrado. Inicia sesión."
        : error.message;
      return toast({ title: "No se pudo registrar", description: msg, variant: "destructive" });
    }
    toast({ title: "Cuenta creada", description: "Bienvenido a tu nuevo tablero." });
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.redirected) return;
    if (result.error) {
      toast({ title: "Error con Google", description: result.error.message, variant: "destructive" });
      return;
    }
    navigate("/", { replace: true });
  };

  if (authLoading || session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground">
        <div className="flex items-center gap-2">
          <FolderKanban className="h-6 w-6" />
          <span className="font-bold tracking-tight">Tablero Kanban</span>
        </div>
        <div className="space-y-4 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Organiza tu trabajo con claridad.</h1>
          <p className="text-primary-foreground/80 leading-relaxed">
            Tareas, proyectos, comentarios y subtareas con razonamiento asistido por IA. Todo en un mismo lugar, sincronizado en la nube.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/60">© {new Date().getFullYear()} · Hecho con cariño</p>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <FolderKanban className="h-5 w-5 text-primary" />
            <span className="font-bold">Tablero Kanban</span>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <h2 className="text-xl font-semibold mb-1">Bienvenido de nuevo</h2>
              <p className="text-sm text-muted-foreground mb-5">Ingresa tus credenciales para continuar.</p>
              <form onSubmit={handleSignIn} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="si-email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="si-email" type="email" placeholder="tu@correo.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="si-pwd">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="si-pwd" type="password" placeholder="••••••••" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Iniciar Sesión"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <h2 className="text-xl font-semibold mb-1">Crea tu cuenta</h2>
              <p className="text-sm text-muted-foreground mb-5">Empieza a organizar tus proyectos en segundos.</p>
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="su-name">Nombre</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="su-name" placeholder="Tu nombre" className="pl-9" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="su-email" type="email" placeholder="tu@correo.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-pwd">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="su-pwd" type="password" placeholder="Mínimo 6 caracteres" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear cuenta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">o continúa con</span>
            </div>
          </div>

          {/* Social */}
          <div className="grid gap-2">
            <Button variant="outline" type="button" onClick={handleGoogle} className="gap-2">
              <GoogleIcon />
              Continuar con Google
            </Button>
            <Button variant="outline" type="button" disabled className="gap-2 opacity-60 cursor-not-allowed">
              <Github className="h-4 w-4" />
              GitHub <span className="text-[10px] font-normal text-muted-foreground">(próximamente)</span>
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground text-center mt-6 leading-relaxed">
            Al continuar aceptas el uso de tus datos para la operación del servicio.
          </p>
        </div>
      </main>
    </div>
  );
}
