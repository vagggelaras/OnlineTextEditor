import { createPortal } from "react-dom"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useConfirmStore } from "@/stores/confirmStore"

export function ConfirmDialog() {
  const { isOpen, title, description, confirmLabel, variant, handleConfirm, handleCancel } =
    useConfirmStore()

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-sm border border-border p-6">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            size="sm"
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
