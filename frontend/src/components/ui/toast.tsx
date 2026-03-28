import { createPortal } from "react-dom"
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react"
import { useToastStore } from "@/stores/toastStore"
import { cn } from "@/lib/utils"

const icons = {
  default: Info,
  success: CheckCircle2,
  destructive: AlertCircle,
}

const styles = {
  default: "border-border",
  success: "border-green-200 dark:border-green-800",
  destructive: "border-destructive/30",
}

const iconStyles = {
  default: "text-muted-foreground",
  success: "text-green-600",
  destructive: "text-destructive",
}

export function Toaster() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const variant = t.variant || "default"
        const Icon = icons[variant]
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto bg-background border rounded-lg shadow-lg p-3 flex items-start gap-3 animate-in slide-in-from-right-full fade-in duration-200",
              styles[variant]
            )}
          >
            <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", iconStyles[variant])} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t.title}</p>
              {t.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>,
    document.body
  )
}
