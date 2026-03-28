import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useDocumentStore } from "@/stores/documentStore"
import { FileText, Plus, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DashboardPage() {
  const { documents, loading, fetchAll, createDocument } = useDocumentStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleNewDoc = async () => {
    const doc = await createDocument()
    navigate(`/editor/${doc.id}`)
  }

  const recentDocs = [...documents]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 12)

  return (
    <div className="h-full overflow-auto bg-muted">
      <div className="max-w-5xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button onClick={handleNewDoc} className="gap-2">
            <Plus className="h-4 w-4" />
            New Document
          </Button>
        </div>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Recent Documents
            </h2>
          </div>

          {loading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : recentDocs.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="font-medium mb-1">No documents yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Create documents, organize them into folders, and collaborate with others in real-time.
              </p>
              <Button onClick={handleNewDoc} className="gap-2">
                <Plus className="h-4 w-4" />
                Create your first document
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recentDocs.map((doc) => (
                <button
                  key={doc.id}
                  className="bg-background rounded-lg border border-border p-4 text-left hover:shadow-md hover:border-primary/30 transition-all"
                  onClick={() => navigate(`/editor/${doc.id}`)}
                >
                  <FileText className="h-8 w-8 text-blue-500 mb-3" />
                  <h3 className="font-medium text-sm truncate">{doc.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(doc.updatedAt).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
