import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Highlight from "@tiptap/extension-highlight"
import { TextStyle } from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import { Table } from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import { Eye, EyeOff } from "lucide-react"

interface SharedDocument {
  id: string
  title: string
  content: unknown
  createdAt: string
  updatedAt: string
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api"

export function SharedPage() {
  const { token } = useParams<{ token: string }>()
  const [document, setDocument] = useState<SharedDocument | null>(null)
  const [permission, setPermission] = useState<string>("view")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return

    fetch(`${API_URL}/shared/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Document not found")
        return res.json()
      })
      .then(({ document, permission }) => {
        setDocument(document)
        setPermission(permission)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: false }),
      TextStyle,
      Color,
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer hover:text-blue-800",
        },
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    editable: permission === "edit",
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none min-h-[calc(100vh-12rem)] p-8",
      },
    },
  })

  // Set content once editor + document are ready
  useEffect(() => {
    if (editor && document?.content) {
      editor.commands.setContent(document.content as any)
    }
  }, [editor, document])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-muted">
        <p className="text-muted-foreground">Loading shared document...</p>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-muted gap-3">
        <EyeOff className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">{error || "Document not found"}</p>
        <p className="text-sm text-muted-foreground/60">
          This share link may have been revoked or never existed.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-background border-b border-border px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{document.title}</h1>
          <p className="text-xs text-muted-foreground">Shared document</p>
        </div>
        <span className="text-xs flex items-center gap-1 text-muted-foreground">
          <Eye className="h-3 w-3" />
          {permission === "edit" ? "Edit access" : "View only"}
        </span>
      </div>

      {/* Editor */}
      <div className="max-w-[850px] mx-auto mt-8 mb-8">
        <div className="bg-white shadow-lg rounded-sm min-h-[1100px]">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
