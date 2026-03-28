import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Plus, Home, FolderPlus, LogOut, Search, X } from "lucide-react"
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
  const [searchQuery, setSearchQuery] = useState("")

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
            <div className="px-2 mb-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input
                  className="w-full h-7 text-xs pl-7 pr-7 rounded-md border border-input bg-background outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Filter documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            <FileTree onOpenDocument={handleOpenDoc} activeDocId={currentDoc?.id} searchQuery={searchQuery} />
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
