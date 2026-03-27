import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Plus, Home, FolderPlus, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FileTree } from "@/components/files/FileTree"
import { useDocumentStore } from "@/stores/documentStore"
import { useAuthStore } from "@/stores/authStore"

interface SidebarProps {
  isOpen: boolean
}

export function Sidebar({ isOpen }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { createDocument, createFolder, currentDoc } = useDocumentStore()
  const { logout } = useAuthStore()
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [folderName, setFolderName] = useState("")

  if (!isOpen) return null

  const handleNewDoc = async () => {
    const doc = await createDocument()
    navigate(`/editor/${doc.id}`)
  }

  const handleNewFolder = async () => {
    if (folderName.trim()) {
      await createFolder({ name: folderName.trim() })
      setFolderName("")
      setCreatingFolder(false)
    }
  }

  const handleOpenDoc = (id: string) => {
    navigate(`/editor/${id}`)
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <aside className="w-64 border-r border-border bg-background flex flex-col shrink-0">
      <div className="p-3 border-b border-border space-y-2">
        <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={handleNewDoc}>
          <Plus className="h-4 w-4" />
          New Document
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => setCreatingFolder(true)}
        >
          <FolderPlus className="h-4 w-4" />
          New Folder
        </Button>
      </div>

      {creatingFolder && (
        <div className="px-3 py-2 border-b border-border">
          <input
            className="w-full text-sm border border-input rounded px-2 py-1 bg-background outline-none focus:ring-1 focus:ring-ring"
            placeholder="Folder name..."
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleNewFolder()
              if (e.key === "Escape") setCreatingFolder(false)
            }}
            onBlur={() => { if (!folderName.trim()) setCreatingFolder(false) }}
            autoFocus
          />
        </div>
      )}

      <nav className="flex-1 overflow-auto p-2">
        <div className="space-y-1">
          <button
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent text-left ${
              location.pathname === "/" ? "bg-accent" : ""
            }`}
            onClick={() => navigate("/")}
          >
            <Home className="h-4 w-4" />
            Dashboard
          </button>

          <div className="pt-2">
            <div className="flex items-center justify-between px-3 mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Documents
              </span>
            </div>
            <FileTree onOpenDocument={handleOpenDoc} activeDocId={currentDoc?.id} />
          </div>
        </div>
      </nav>

      <div className="p-3 border-t border-border">
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
