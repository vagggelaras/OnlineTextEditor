import { useEffect, useRef, useCallback, useState, useMemo } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Highlight from "@tiptap/extension-highlight"
import { TextStyle } from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { Table } from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import Collaboration from "@tiptap/extension-collaboration"
import { Extension } from "@tiptap/core"
import { yCursorPlugin } from "@tiptap/y-tiptap"
import { HocuspocusProvider } from "@hocuspocus/provider"
import * as Y from "yjs"
import { EditorToolbar } from "./EditorToolbar"
import { useDocumentStore } from "@/stores/documentStore"
import { useAuthStore } from "@/stores/authStore"
import { Wifi, WifiOff, Users, Share2 } from "lucide-react"
import { ChartPanel } from "@/components/charts/ChartPanel"
import { ShareDialog } from "@/components/share/ShareDialog"
import { ExportMenu } from "@/components/export/ExportMenu"
import { VersionPanel } from "@/components/versions/VersionPanel"
import { Button } from "@/components/ui/button"
import type { Document } from "@/types/document"

interface EditorProps {
  document: Document
}

// Generate a consistent color from a string (user ID)
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

// Custom CollaborationCursor using @tiptap/y-tiptap (compatible with TipTap v3)
const CollaborationCursor = Extension.create<{
  provider: HocuspocusProvider | null
  user: { name: string; color: string }
}>({
  name: "collaborationCursor",

  addOptions() {
    return {
      provider: null,
      user: { name: "Anonymous", color: "#cccccc" },
    }
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

export function Editor({ document: doc }: EditorProps) {
  const { updateDocument } = useDocumentStore()
  const user = useAuthStore((s) => s.user)
  const [title, setTitle] = useState(doc.title)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [connectedUsers, setConnectedUsers] = useState<{ name: string; color: string }[]>([])
  const [chartPanelOpen, setChartPanelOpen] = useState(false)
  const [versionPanelOpen, setVersionPanelOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentInitialized = useRef(false)

  // Create Yjs document and Hocuspocus provider
  const ydoc = useMemo(() => new Y.Doc(), [])
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null)

  useEffect(() => {
    let destroyed = false
    let prov: HocuspocusProvider | null = null

    const wsUrl = import.meta.env.VITE_WS_URL || (import.meta.env.PROD
      ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`
      : "ws://localhost:3001")

    // Fetch a short-lived WS token, then connect
    const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:3001/api")
    fetch(`${apiUrl}/auth/ws-token`, { credentials: "include" })
      .then((res) => res.json())
      .then(({ token }) => {
        if (destroyed) return
        prov = new HocuspocusProvider({
          url: wsUrl,
          name: doc.id,
          document: ydoc,
          token,
          onStatus({ status }: { status: string }) {
            setConnectionStatus(status as "connecting" | "connected" | "disconnected")
          },
          onAwarenessChange({ states }: { states: any[] }) {
            const users = states
              .filter((s: any) => s.user)
              .map((s: any) => s.user)
            setConnectedUsers(users)
          },
        })
        setProvider(prov)
      })
      .catch(() => {
        setConnectionStatus("disconnected")
      })

    return () => {
      destroyed = true
      prov?.destroy()
    }
  }, [doc.id, ydoc])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // Disable these — we add them separately or Yjs replaces them
        undoRedo: false,
        link: false,
        underline: false,
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: false }),
      TextStyle,
      Color,
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer hover:text-blue-800",
        },
      }),
      Placeholder.configure({ placeholder: "Start writing..." }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider,
        user: {
          name: user?.name || "Anonymous",
          color: userColor(user?.id || "anon"),
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none min-h-[calc(100vh-12rem)] p-8",
      },
    },
  }, [ydoc, provider])

  // Migrate existing content: if Yjs doc is empty after sync, load saved JSON content
  useEffect(() => {
    if (!editor || !provider || contentInitialized.current) return

    const handleSynced = () => {
      if (contentInitialized.current) return
      contentInitialized.current = true

      // Check if the Yjs document is empty
      const fragment = ydoc.getXmlFragment("default")
      if (fragment.length === 0 && doc.content) {
        // First time opening this doc with collaboration — seed it with existing content
        editor.commands.setContent(doc.content as any)
      }
    }

    provider.on("synced", handleSynced)

    // If already synced when this effect runs
    if (provider.isSynced) {
      handleSynced()
    }

    return () => {
      provider.off("synced", handleSynced)
    }
  }, [editor, provider, ydoc, doc.content])

  // Title change with debounce
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle)
      if (titleTimer.current) clearTimeout(titleTimer.current)
      titleTimer.current = setTimeout(() => {
        updateDocument(doc.id, { title: newTitle || "Untitled Document" })
      }, 1000)
    },
    [doc.id, updateDocument]
  )

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (titleTimer.current) clearTimeout(titleTimer.current)
    }
  }, [])

  return (
    <div className="flex flex-col h-full">
      <EditorToolbar
        editor={editor}
        onToggleCharts={() => setChartPanelOpen(!chartPanelOpen)}
        chartPanelOpen={chartPanelOpen}
        onToggleVersions={() => setVersionPanelOpen(!versionPanelOpen)}
        versionPanelOpen={versionPanelOpen}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto bg-muted">
          <div className="max-w-[850px] mx-auto mt-8 mb-8">
            {/* Title + status bar */}
            <div className="flex items-center gap-3 px-8 mb-2">
              <input
                className="flex-1 text-2xl font-bold bg-transparent outline-none border-none placeholder:text-muted-foreground"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Untitled Document"
              />

              {/* Connected users */}
              {connectedUsers.length > 1 && (
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="flex -space-x-1.5">
                    {connectedUsers
                      .filter((u) => u.name !== user?.name)
                      .slice(0, 5)
                      .map((u, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white"
                          style={{ backgroundColor: u.color }}
                          title={u.name}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Share + Export */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShareDialogOpen(true)}
                className="h-8 gap-1.5 text-xs"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </Button>
              {editor && <ExportMenu editor={editor} title={title} />}

              {/* Connection status */}
              {connectionStatus === "connected" ? (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <Wifi className="h-3 w-3" /> Synced
                </span>
              ) : connectionStatus === "connecting" ? (
                <span className="text-xs text-yellow-600 flex items-center gap-1">
                  <Wifi className="h-3 w-3" /> Connecting...
                </span>
              ) : (
                <span className="text-xs text-red-500 flex items-center gap-1">
                  <WifiOff className="h-3 w-3" /> Offline
                </span>
              )}
            </div>

            {/* Editor */}
            <div className="bg-white shadow-lg rounded-sm min-h-[1100px]">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {/* Side panels */}
        {chartPanelOpen && (
          <div className="w-[380px] shrink-0 h-full">
            <ChartPanel documentId={doc.id} onClose={() => setChartPanelOpen(false)} />
          </div>
        )}
        {versionPanelOpen && (
          <div className="w-[380px] shrink-0 h-full">
            <VersionPanel
              documentId={doc.id}
              onClose={() => setVersionPanelOpen(false)}
              onRestore={() => {
                // Reload the page to get fresh content after restore
                window.location.reload()
              }}
            />
          </div>
        )}
      </div>

      {/* Share dialog */}
      {shareDialogOpen && (
        <ShareDialog documentId={doc.id} onClose={() => setShareDialogOpen(false)} />
      )}
    </div>
  )
}
