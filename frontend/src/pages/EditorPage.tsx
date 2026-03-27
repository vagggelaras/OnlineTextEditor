import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useDocumentStore } from "@/stores/documentStore"
import { Editor } from "@/components/editor/Editor"

export function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { openDocument, currentDoc, setCurrentDoc } = useDocumentStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      navigate("/")
      return
    }

    setLoading(true)
    openDocument(id)
      .then(() => setLoading(false))
      .catch(() => {
        navigate("/")
      })

    return () => {
      setCurrentDoc(null)
    }
  }, [id])

  if (loading || !currentDoc) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading document...</p>
      </div>
    )
  }

  return <Editor document={currentDoc} />
}
