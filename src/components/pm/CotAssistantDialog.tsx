import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Loader2, Sparkles, ListPlus, RotateCcw } from "lucide-react";
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

/**
 * Heuristic Chain-of-Thought generator.
 * Produces 3 logical reasoning steps based on verbs detected in the task title.
 * 100% local, no backend required.
 */
function generateCoTSteps(title: string): string[] {
  const t = title.trim().toLowerCase();
  const subject = title.trim().replace(/^(crear|añadir|agregar|hacer|implementar|diseñar|construir|desarrollar|configurar)\s+/i, "");

  // Pattern matching by intent
  if (/login|auth|sesi[oó]n|registro|signup/.test(t)) {
    return [
      `Diseñar el formulario de "${subject}" con validaciones de email y contraseña.`,
      `Configurar la lógica de autenticación conectando el frontend con el backend.`,
      `Realizar pruebas de seguridad y manejo de errores (credenciales inválidas, rate limiting).`,
    ];
  }
  if (/api|endpoint|backend|servicio/.test(t)) {
    return [
      `Definir el contrato de la API para "${subject}" (rutas, métodos, payloads).`,
      `Implementar la lógica del endpoint con validación de entrada y autorización.`,
      `Documentar el endpoint y escribir pruebas de integración.`,
    ];
  }
  if (/dise[ñn]ar|ui|interfaz|componente|landing|p[aá]gina/.test(t)) {
    return [
      `Bocetar la estructura visual de "${subject}" definiendo jerarquía y espaciado.`,
      `Implementar el componente con tokens del sistema de diseño y estados (hover, loading, error).`,
      `Validar accesibilidad (contraste, navegación por teclado) y responsividad en móvil.`,
    ];
  }
  if (/test|prueba|qa|bug|error|arreglar|fix/.test(t)) {
    return [
      `Reproducir y aislar el comportamiento esperado vs. el actual de "${subject}".`,
      `Escribir un test que falle, corregir la causa raíz y verificar que pase.`,
      `Añadir casos límite y validar que no haya regresiones en flujos relacionados.`,
    ];
  }
  if (/base de datos|db|esquema|tabla|migraci[oó]n/.test(t)) {
    return [
      `Modelar las entidades y relaciones necesarias para "${subject}".`,
      `Crear la migración aplicando índices y restricciones de integridad.`,
      `Probar consultas críticas y configurar políticas de seguridad de acceso.`,
    ];
  }
  if (/desplegar|deploy|publicar/.test(t)) {
    return [
      `Preparar variables de entorno y verificar el build de producción para "${subject}".`,
      `Ejecutar el despliegue y validar logs en tiempo real.`,
      `Realizar smoke tests post-deploy y configurar monitoreo de errores.`,
    ];
  }
  if (/documentar|readme|gu[ií]a/.test(t)) {
    return [
      `Definir audiencia y alcance de la documentación de "${subject}".`,
      `Redactar secciones clave: instalación, uso básico y ejemplos.`,
      `Revisar con un caso de uso real y publicar en el repositorio.`,
    ];
  }

  // Generic fallback CoT
  return [
    `Analizar requisitos y dividir "${subject}" en componentes manejables.`,
    `Implementar la solución paso a paso, validando cada componente individualmente.`,
    `Probar el resultado completo, documentar decisiones y refinar según feedback.`,
  ];
}

export default function CotAssistantDialog({ open, onOpenChange, taskTitle, onConvertToSubtasks }: Props) {
  const [phase, setPhase] = useState<"idle" | "thinking" | "revealing" | "done">("idle");
  const [steps, setSteps] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  const runAssistant = () => {
    clearTimers();
    setPhase("thinking");
    setSteps([]);
    setVisibleCount(0);

    // Simulate "thinking" delay
    timersRef.current.push(
      window.setTimeout(() => {
        const generated = generateCoTSteps(taskTitle);
        setSteps(generated);
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
      }, 1200)
    );
  };

  // Auto-run when dialog opens
  useEffect(() => {
    if (open) {
      runAssistant();
    } else {
      clearTimers();
      setPhase("idle");
      setSteps([]);
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
          </AnimatePresence>
        </div>

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
      </DialogContent>
    </Dialog>
  );
}
