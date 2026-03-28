import { useEffect, useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useEditor, EditorContent } from "@tiptap/react"
import { Extension } from "@tiptap/core"
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
import Collaboration from "@tiptap/extension-collaboration"
import { yCursorPlugin } from "@tiptap/y-tiptap"
import { HocuspocusProvider } from "@hocuspocus/provider"
import * as Y from "yjs"
import { Eye, EyeOff, Pencil, Users, LogIn } from "lucide-react"
import { EditorToolbar } from "@/components/editor/EditorToolbar"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"

interface SharedDocument {
  id: string
  title: string
  content: unknown
  createdAt: string
  updatedAt: string
}

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:3001/api")

function userColor(str: string): string {
  const colors = [
    "#958DF1", "#F98181", "#FBBC88", "#FAF594",
    "#70CFF8", "#94FADB", "#B9F18D", "#E8A0BF",
    "#FFC078", "#8EE3EF", "#DDA0DD", "#98D8C8",
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// Collaboration cursor extension (same as main editor)
const CollaborationCursor = Extension.create<{
  provider: HocuspocusProvider | null
  user: { name: string; color: string }
}>({
  name: "collaborationCursor",
  addOptions() {
    return { provider: null, user: { name: "Anonymous", color: "#cccccc" } }
  },
  addProseMirrorPlugins() {
    const { provider, user } = this.options
    if (!provider) return []
    provider.awareness!.setLocalStateField("user", user)
    return [
      yCursorPlugin(provider.awareness!, {
        cursorBuilder: (cursorUser: { name: string; color: string }) => {
          const cursor = document.createElement("span")
          cursor.classList.add("collaboration-cursor__caret")
          cursor.setAttribute("style", `border-color: ${cursorUser.color}`)
          const label = document.createElement("div")
          label.classList.add("collaboration-cursor__label")
          label.setAttribute("style", `background-color: ${cursorUser.color}`)
          label.textContent = cursorUser.name
          cursor.appendChild(label)
          return cursor
        },
      }),
    ]
  },
})

export function SharedPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user, checkAuth, loading: authLoading } = useAuthStore()
  const [sharedDoc, setSharedDoc] = useState<SharedDocument | null>(null)
  const [permission, setPermission] = useState<string>("view")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null)
  const [connectedUsers, setConnectedUsers] = useState<{ name: string; color: string }[]>([])

  const ydoc = useMemo(() => new Y.Doc(), [])

  // Check if user is logged in (only if we don't already know)
  useEffect(() => {
    if (!user) checkAuth()
  }, [user, checkAuth])

  // Fetch shared document metadata
  useEffect(() => {
    if (!token) return

    fetch(`${API_URL}/shared/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Document not found")
        return res.json()
      })
      .then(({ document, permission }) => {
        setSharedDoc(document)
        setPermission(permission)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  const canEdit = permission === "edit" && !!user

  // For edit permission with logged-in user, connect to Hocuspocus
  useEffect(() => {
    if (!canEdit || !sharedDoc || authLoading) return

    let destroyed = false
    let prov: HocuspocusProvider | null = null

    const wsUrl = import.meta.env.VITE_WS_URL || (import.meta.env.PROD
      ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`
      : "ws://localhost:3001")

    // Use the user's own auth token for WS (they're logged in)
    fetch(`${API_URL}/auth/ws-token`, { credentials: "include" })
      .then((res) => res.json())
      .then(({ token: wsToken }) => {
        if (destroyed) return
        prov = new HocuspocusProvider({
          url: wsUrl,
          name: sharedDoc.id,
          document: ydoc,
          token: wsToken,
          onAwarenessChange({ states }: { states: any[] }) {
            const users = states
              .filter((s: any) => s.user)
              .map((s: any) => s.user)
            setConnectedUsers(users)
          },
        })
        setProvider(prov)
      })
      .catch(() => {})

    return () => {
      destroyed = true
      prov?.destroy()
    }
  }, [canEdit, sharedDoc, authLoading, ydoc])

  // Extensions for view mode
  const viewExtensions = useMemo(() => [
    StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
    Underline,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Highlight.configure({ multicolor: false }),
    TextStyle,
    Color,
    ImageExt.configure({ inline: false, allowBase64: true }),
    Link.configure({
      openOnClick: true,
      HTMLAttributes: { class: "text-blue-600 underline cursor-pointer hover:text-blue-800" },
    }),
    Table.configure({ resizable: false }),
    TableRow,
    TableCell,
    TableHeader,
  ], [])

  // Extensions for edit mode (with Yjs collaboration + cursors)
  const editExtensions = useMemo(() => [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      undoRedo: false,
      link: false,
      underline: false,
    }),
    Underline,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Highlight.configure({ multicolor: false }),
    TextStyle,
    Color,
    ImageExt.configure({ inline: false, allowBase64: true }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: "text-blue-600 underline cursor-pointer hover:text-blue-800" },
    }),
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader,
    Collaboration.configure({ document: ydoc }),
    ...(provider ? [CollaborationCursor.configure({
      provider,
      user: {
        name: user?.name || "Anonymous",
        color: userColor(user?.id || "anon"),
      },
    })] : []),
  ], [ydoc, provider, user])

  const editor = useEditor({
    extensions: canEdit ? editExtensions : viewExtensions,
    editable: canEdit,
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none min-h-[calc(100vh-12rem)] p-8",
      },
    },
  }, [canEdit, editExtensions, viewExtensions])

  // Set content for view mode (edit mode gets content from Yjs)
  useEffect(() => {
    if (editor && sharedDoc?.content && !canEdit) {
      editor.commands.setContent(sharedDoc.content as any)
    }
  }, [editor, sharedDoc, canEdit])

  if (loading || (authLoading && !user)) {
    return (
      <div className="flex items-center justify-center h-screen bg-muted">
        <p className="text-muted-foreground">Loading shared document...</p>
      </div>
    )
  }

  if (error || !sharedDoc) {
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

  // Edit permission but not logged in — prompt to log in
  if (permission === "edit" && !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-muted gap-4">
        <LogIn className="h-12 w-12 text-muted-foreground/40" />
        <h2 className="text-lg font-semibold">Sign in to edit</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          This document has been shared with edit access. Please sign in so others can see who is making changes.
        </p>
        <Button onClick={() => navigate(`/login?redirect=/shared/${token}`)}>
          <LogIn className="h-4 w-4 mr-2" />
          Sign in
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-background border-b border-border px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{sharedDoc.title}</h1>
          <p className="text-xs text-muted-foreground">Shared document</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Connected users */}
          {canEdit && connectedUsers.length > 1 && (
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex -space-x-1.5">
                {connectedUsers.map((u, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white border-2 border-background"
                    style={{ backgroundColor: u.color }}
                    title={u.name}
                  >
                    {u.name[0]?.toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          )}
          <span className="text-xs flex items-center gap-1 text-muted-foreground">
            {canEdit ? (
              <>
                <Pencil className="h-3 w-3" />
                Editing as {user?.name}
              </>
            ) : (
              <>
                <Eye className="h-3 w-3" />
                View only
              </>
            )}
          </span>
        </div>
      </div>

      {/* Toolbar for edit mode */}
      {canEdit && (
        <div className="bg-background border-b border-border">
          <EditorToolbar editor={editor} />
        </div>
      )}

      {/* Editor */}
      <div className="max-w-[850px] mx-auto mt-8 mb-8">
        <div className="bg-white shadow-lg rounded-sm min-h-[1100px]">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
