import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Loader2, Sparkles, ListPlus, RotateCcw, BookOpen, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  onConvertToSubtasks: (steps: string[]) => void;
}

const COT_API_URL = "https://anime-crawlers-dairy.ngrok-free.dev/razonar";

interface CotResponse {
  cot_steps?: string[];
  grounding_source?: string;
}

async function fetchCoTSteps(title: string): Promise<CotResponse> {
  const res = await fetch(COT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // ngrok free tier requires this header to bypass the browser warning page
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify({ titulo: title, title }),
  });

  if (!res.ok) {
    throw new Error(`El servidor respondió con estado ${res.status}`);
  }

  const data = (await res.json()) as CotResponse;
  return data;
}

export default function CotAssistantDialog({ open, onOpenChange, taskTitle, onConvertToSubtasks }: Props) {
  const [phase, setPhase] = useState<"idle" | "thinking" | "revealing" | "done" | "error">("idle");
  const [steps, setSteps] = useState<string[]>([]);
  const [groundingSource, setGroundingSource] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState(0);
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  const runAssistant = async () => {
    clearTimers();
    setPhase("thinking");
    setSteps([]);
    setGroundingSource("");
    setErrorMsg("");
    setVisibleCount(0);

    try {
      const data = await fetchCoTSteps(taskTitle);
      const generated = Array.isArray(data.cot_steps) ? data.cot_steps.filter(Boolean) : [];
      const source = typeof data.grounding_source === "string" ? data.grounding_source : "";

      // Log to terminal/console as requested
      console.log("[CoT] Pasos de razonamiento:", generated);
      if (source) console.log("[CoT] Fuente oficial (grounding_source):", source);

      if (generated.length === 0) {
        throw new Error("La respuesta no contiene 'cot_steps' válidos.");
      }

      setSteps(generated);
      setGroundingSource(source);
      setPhase("revealing");

      // Reveal each step with a delay
      generated.forEach((_, i) => {
        timersRef.current.push(
          window.setTimeout(() => {
            setVisibleCount(i + 1);
            if (i === generated.length - 1) {
              timersRef.current.push(
                window.setTimeout(() => setPhase("done"), 400)
              );
            }
          }, 700 * (i + 1))
        );
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      console.error("[CoT] Error al contactar el servidor:", err);
      const isLikelyCors = message.includes("Failed to fetch") || message.includes("NetworkError");
      setErrorMsg(
        isLikelyCors
          ? "No se pudo conectar al servidor de razonamiento. Es probable un error de CORS: tu servidor debe responder con el header 'Access-Control-Allow-Origin: *' (o el origen de esta app) y manejar las peticiones OPTIONS preflight."
          : `No se pudo obtener la respuesta del servidor: ${message}`
      );
      setPhase("error");
      toast({
        title: "Error en el Asistente CoT",
        description: isLikelyCors ? "Posible error de CORS. Revisa la consola." : message,
        variant: "destructive",
      });
    }
  };

  // Auto-run when dialog opens
  useEffect(() => {
    if (open) {
      runAssistant();
    } else {
      clearTimers();
      setPhase("idle");
      setSteps([]);
      setGroundingSource("");
      setErrorMsg("");
      setVisibleCount(0);
    }
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleConvert = () => {
    onConvertToSubtasks(steps);
    toast({
      title: "Subtareas creadas",
      description: `Se añadieron ${steps.length} pasos como subtareas.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Brain className="h-4 w-4" />
            </span>
            Asistente de Razonamiento CoT
          </DialogTitle>
          <DialogDescription className="text-left">
            Análisis de: <span className="font-medium text-foreground">"{taskTitle}"</span>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 min-h-[220px]">
          <AnimatePresence mode="wait">
            {phase === "thinking" && (
              <motion.div
                key="thinking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 gap-3"
              >
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">
                  Analizando tarea mediante Chain of Thought...
                </p>
              </motion.div>
            )}

            {(phase === "revealing" || phase === "done") && (
              <motion.ol
                key="steps"
                className="space-y-2.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {steps.slice(0, visibleCount).map((step, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex gap-3 rounded-lg border bg-surface-2 p-3"
                  >
                    <span className="shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                      {i + 1}
                    </span>
                    <p className="text-sm text-foreground leading-snug pt-0.5">{step}</p>
                  </motion.li>
                ))}
                {phase === "revealing" && visibleCount < steps.length && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground"
                  >
                    <Sparkles className="h-3 w-3 animate-pulse" />
                    <span>Pensando en el siguiente paso...</span>
                  </motion.div>
                )}
              </motion.ol>
            )}

            {phase === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-10 gap-3 text-center"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                </span>
                <p className="text-sm text-foreground font-medium">No se pudo generar el razonamiento</p>
                <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">{errorMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {phase === "done" && groundingSource && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 mt-1"
          >
            <BookOpen className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary mb-0.5">
                Fuente oficial
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed break-words">
                {groundingSource}
              </p>
            </div>
          </motion.div>
        )}

        {phase === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 pt-2 border-t"
          >
            <Button variant="ghost" size="sm" onClick={runAssistant} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Regenerar
            </Button>
            <Button size="sm" className="ml-auto gap-1.5" onClick={handleConvert}>
              <ListPlus className="h-3.5 w-3.5" />
              Convertir en Subtareas
            </Button>
          </motion.div>
        )}

        {phase === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 pt-2 border-t"
          >
            <Button size="sm" className="ml-auto gap-1.5" onClick={runAssistant}>
              <RotateCcw className="h-3.5 w-3.5" />
              Reintentar
            </Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
