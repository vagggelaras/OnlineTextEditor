import { create } from "zustand"

interface ConfirmOptions {
  title: string
  description: string
  confirmLabel?: string
  variant?: "destructive" | "default"
}

interface ConfirmState {
  isOpen: boolean
  title: string
  description: string
  confirmLabel: string
  variant: "destructive" | "default"
  resolve: ((value: boolean) => void) | null
  show: (options: ConfirmOptions) => Promise<boolean>
  handleConfirm: () => void
  handleCancel: () => void
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  title: "",
  description: "",
  confirmLabel: "Delete",
  variant: "destructive",
  resolve: null,

  show: (options) => {
    return new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        title: options.title,
        description: options.description,
        confirmLabel: options.confirmLabel || "Delete",
        variant: options.variant || "destructive",
        resolve,
      })
    })
  },

  handleConfirm: () => {
    get().resolve?.(true)
    set({ isOpen: false, resolve: null })
  },

  handleCancel: () => {
    get().resolve?.(false)
    set({ isOpen: false, resolve: null })
  },
}))

// Imperative helper
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return useConfirmStore.getState().show(options)
}
