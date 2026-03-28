import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { Copy, Check, Link, Trash2, X, Globe } from "lucide-react"
import { toast } from "@/stores/toastStore"
import { confirmDialog } from "@/stores/confirmStore"

interface Share {
  id: string
  shareToken: string
  permission: string
  createdAt: string
}

interface ShareDialogProps {
  documentId: string
  onClose: () => void
}

export function ShareDialog({ documentId, onClose }: ShareDialogProps) {
  const [shares, setShares] = useState<Share[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchShares = useCallback(async () => {
    setLoading(true)
    const { shares } = await api.get<{ shares: Share[] }>(`/documents/${documentId}/shares`)
    setShares(shares)
    setLoading(false)
  }, [documentId])

  useEffect(() => {
    fetchShares()
  }, [fetchShares])

  const createShare = async (permission: string) => {
    setCreating(true)
    try {
      const { share } = await api.post<{ share: Share }>(`/documents/${documentId}/shares`, {
        permission,
      })
      setShares([share, ...shares])
      toast({ title: `${permission === "edit" ? "Edit" : "View-only"} link created`, variant: "success" })
    } catch (err) {
      toast({ title: "Failed to create share link", description: (err as Error).message, variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const deleteShare = async (id: string) => {
    const ok = await confirmDialog({ title: "Delete share link", description: "Anyone with this link will lose access." })
    if (!ok) return
    try {
      await api.delete(`/documents/${documentId}/shares/${id}`)
      setShares(shares.filter((s) => s.id !== id))
      toast({ title: "Share link deleted", variant: "success" })
    } catch (err) {
      toast({ title: "Failed to delete share link", description: (err as Error).message, variant: "destructive" })
    }
  }

  const togglePermission = async (share: Share) => {
    const newPerm = share.permission === "view" ? "edit" : "view"
    try {
      const { share: updated } = await api.patch<{ share: Share }>(
        `/documents/${documentId}/shares/${share.id}`,
        { permission: newPerm }
      )
      setShares(shares.map((s) => (s.id === updated.id ? updated : s)))
      toast({ title: `Permission changed to ${newPerm}`, variant: "success" })
    } catch (err) {
      toast({ title: "Failed to update permission", description: (err as Error).message, variant: "destructive" })
    }
  }

  const getShareUrl = (token: string) => {
    return `${window.location.origin}/shared/${token}`
  }

  const copyToClipboard = async (share: Share) => {
    await navigator.clipboard.writeText(getShareUrl(share.shareToken))
    setCopiedId(share.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-md border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Share Document</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Create new link */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => createShare("view")}
              disabled={creating}
              className="flex-1"
            >
              <Link className="h-3.5 w-3.5 mr-1.5" />
              View-only link
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => createShare("edit")}
              disabled={creating}
              className="flex-1"
            >
              <Link className="h-3.5 w-3.5 mr-1.5" />
              Edit link
            </Button>
          </div>

          {/* Existing shares */}
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          ) : shares.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No share links yet. Create one above.
            </p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center gap-2 p-2 rounded-md border border-border bg-muted/50"
                >
                  <Input
                    readOnly
                    value={getShareUrl(share.shareToken)}
                    className="h-8 text-xs bg-background"
                  />
                  <button
                    onClick={() => togglePermission(share)}
                    className={`text-[10px] font-medium px-2 py-1 rounded-md whitespace-nowrap ${
                      share.permission === "edit"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {share.permission}
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(share)}
                    className="h-8 w-8 p-0 shrink-0"
                  >
                    {copiedId === share.id ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteShare(share.id)}
                    className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
