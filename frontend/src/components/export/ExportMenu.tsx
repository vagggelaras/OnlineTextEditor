import { useState, useRef, useEffect } from "react"
import type { Editor } from "@tiptap/react"
import { Button } from "@/components/ui/button"
import { Download, FileText, FileCode, FileType, Archive } from "lucide-react"
import { exportAsHTML, exportAsMarkdown, exportAsPDF, exportAllAsZip } from "@/lib/export"
import { toast } from "@/stores/toastStore"

interface ExportMenuProps {
  editor: Editor
  title: string
}

export function ExportMenu({ editor, title }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  const handleExport = async (format: "html" | "markdown" | "pdf" | "zip") => {
    setExporting(true)
    try {
      if (format === "zip") {
        await exportAllAsZip()
        toast({ title: "All documents exported as ZIP", variant: "success" })
      } else {
        const docTitle = title || "Untitled Document"
        if (format === "html") {
          exportAsHTML(editor, docTitle)
        } else if (format === "markdown") {
          exportAsMarkdown(editor, docTitle)
        } else {
          await exportAsPDF(editor, docTitle)
        }
        toast({ title: `Exported as ${format.toUpperCase()}`, variant: "success" })
      }
    } catch (err) {
      toast({ title: "Export failed", description: (err as Error).message, variant: "destructive" })
    } finally {
      setExporting(false)
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        disabled={exporting}
        className="h-8 gap-1.5 text-xs"
      >
        <Download className="h-3.5 w-3.5" />
        {exporting ? "Exporting..." : "Export"}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-background border border-border rounded-md shadow-lg z-50 py-1">
          <div className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            This document
          </div>
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors"
            onClick={() => handleExport("pdf")}
          >
            <FileText className="h-4 w-4 text-red-500" />
            Export as PDF
          </button>
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors"
            onClick={() => handleExport("html")}
          >
            <FileCode className="h-4 w-4 text-orange-500" />
            Export as HTML
          </button>
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors"
            onClick={() => handleExport("markdown")}
          >
            <FileType className="h-4 w-4 text-blue-500" />
            Export as Markdown
          </button>

          <div className="border-t border-border my-1" />
          <div className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            All documents
          </div>
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors"
            onClick={() => handleExport("zip")}
          >
            <Archive className="h-4 w-4 text-purple-500" />
            Export All as ZIP
          </button>
        </div>
      )}
    </div>
  )
}
