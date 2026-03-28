import { useEffect, useState, useCallback } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, History, RotateCcw, Plus, Trash2, Eye, EyeOff } from "lucide-react"
import { toast } from "@/stores/toastStore"
import { confirmDialog } from "@/stores/confirmStore"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Highlight from "@tiptap/extension-highlight"
import { TextStyle } from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import ImageExt from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import { Table } from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"

interface Version {
  id: string
  label: string | null
  createdAt: string
  createdBy: string
}

interface VersionDetail extends Version {
  content: unknown
}

interface VersionPanelProps {
  documentId: string
  onClose: () => void
  onRestore: () => void
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return d.toLocaleDateString()
}

export function VersionPanel({ documentId, onClose, onRestore }: VersionPanelProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState<VersionDetail | null>(null)
  const [showLabel, setShowLabel] = useState(false)
  const [labelText, setLabelText] = useState("")
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState(false)

  const fetchVersions = useCallback(async () => {
    setLoading(true)
    const { versions } = await api.get<{ versions: Version[] }>(
      `/documents/${documentId}/versions`
    )
    setVersions(versions)
    setLoading(false)
  }, [documentId])

  useEffect(() => {
    fetchVersions()
  }, [fetchVersions])

  const createVersion = async () => {
    setCreating(true)
    try {
      const { version } = await api.post<{ version: Version }>(
        `/documents/${documentId}/versions`,
        { label: labelText || undefined }
      )
      setVersions([version, ...versions])
      setLabelText("")
      setShowLabel(false)
      toast({ title: "Version saved", variant: "success" })
    } catch (err) {
      toast({ title: "Failed to save version", description: (err as Error).message, variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const viewVersion = async (v: Version) => {
    const { version } = await api.get<{ version: VersionDetail }>(
      `/documents/${documentId}/versions/${v.id}`
    )
    setSelectedVersion(version)
  }

  const restoreVersion = async () => {
    if (!selectedVersion) return
    const ok = await confirmDialog({
      title: "Restore this version?",
      description: "The current document content will be replaced with this version.",
      confirmLabel: "Restore",
      variant: "default",
    })
    if (!ok) return
    setRestoring(true)
    try {
      await api.post(`/documents/${documentId}/versions/${selectedVersion.id}/restore`)
      setSelectedVersion(null)
      onRestore()
      toast({ title: "Version restored", variant: "success" })
    } catch (err) {
      toast({ title: "Failed to restore version", description: (err as Error).message, variant: "destructive" })
    } finally {
      setRestoring(false)
    }
  }

  const deleteVersion = async (id: string) => {
    const ok = await confirmDialog({ title: "Delete version", description: "This version will be permanently deleted." })
    if (!ok) return
    try {
      await api.delete(`/documents/${documentId}/versions/${id}`)
      setVersions(versions.filter((v) => v.id !== id))
      if (selectedVersion?.id === id) setSelectedVersion(null)
      toast({ title: "Version deleted", variant: "success" })
    } catch (err) {
      toast({ title: "Failed to delete version", description: (err as Error).message, variant: "destructive" })
    }
  }

  // Preview editor for viewing old versions
  if (selectedVersion) {
    return (
      <VersionPreview
        version={selectedVersion}
        onBack={() => setSelectedVersion(null)}
        onRestore={restoreVersion}
        restoring={restoring}
      />
    )
  }

  return (
    <div className="h-full flex flex-col bg-background border-l border-border">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <History className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold flex-1">Version History</span>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Save version */}
      <div className="p-3 border-b border-border space-y-2">
        {showLabel ? (
          <div className="flex gap-2">
            <Input
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              placeholder="Version label (optional)"
              className="h-8 text-xs"
              onKeyDown={(e) => e.key === "Enter" && createVersion()}
              autoFocus
            />
            <Button size="sm" onClick={createVersion} disabled={creating} className="h-8">
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowLabel(false)}
              className="h-8"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={() => setShowLabel(true)}
            className="w-full h-8 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" /> Save Current Version
          </Button>
        )}
      </div>

      {/* Version list */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-8">Loading...</p>
        ) : versions.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <History className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground font-medium">No versions saved yet</p>
            <p className="text-xs text-muted-foreground/60 max-w-[200px] mx-auto">
              Save snapshots of your document to track changes over time. You can preview and restore any version.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {versions.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors group"
              >
                <button
                  onClick={() => viewVersion(v)}
                  className="flex-1 text-left"
                >
                  <div className="text-xs font-medium">
                    {v.label || "Unnamed version"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {formatDate(v.createdAt)}
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => viewVersion(v)}
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteVersion(v.id)}
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function VersionPreview({
  version,
  onBack,
  onRestore,
  restoring,
}: {
  version: VersionDetail
  onBack: () => void
  onRestore: () => void
  restoring: boolean
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: false }),
      TextStyle,
      Color,
      ImageExt.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    editable: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none p-4",
      },
    },
  })

  useEffect(() => {
    if (editor && version.content) {
      editor.commands.setContent(version.content as any)
    }
  }, [editor, version.content])

  return (
    <div className="h-full flex flex-col bg-background border-l border-border">
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="text-xs font-semibold">{version.label || "Unnamed version"}</div>
          <div className="text-[10px] text-muted-foreground">{formatDate(version.createdAt)}</div>
        </div>
        <Button
          size="sm"
          onClick={onRestore}
          disabled={restoring}
          className="h-8 text-xs gap-1"
        >
          <RotateCcw className="h-3 w-3" />
          {restoring ? "Restoring..." : "Restore"}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto bg-muted p-2">
        <div className="bg-white rounded-sm shadow-sm min-h-[200px]">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
