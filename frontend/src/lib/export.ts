import type { Editor } from "@tiptap/react"
import TurndownService from "turndown"
import JSZip from "jszip"
import { api } from "@/lib/api"
import type { Document, Folder } from "@/types/document"

// --- Helpers ---

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, "_").trim() || "Untitled"
}

function getStyledHTML(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #333; }
    h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; }
    pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; }
    code { background: #f6f8fa; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #ddd; margin-left: 0; padding-left: 16px; color: #666; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f6f8fa; }
    img { max-width: 100%; }
    a { color: #0366d6; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${bodyHtml}
</body>
</html>`
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function downloadString(filename: string, content: string, mimeType: string) {
  downloadBlob(new Blob([content], { type: mimeType }), filename)
}

function htmlToMarkdown(html: string): string {
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  })
  return turndown.turndown(html)
}

// --- Single-document exports (called from the Editor) ---

export function exportAsHTML(editor: Editor, title: string) {
  const html = editor.getHTML()
  const fullHtml = getStyledHTML(title, html)
  downloadString(`${sanitizeFilename(title)}.html`, fullHtml, "text/html")
}

export function exportAsMarkdown(editor: Editor, title: string) {
  const html = editor.getHTML()
  const md = `# ${title}\n\n${htmlToMarkdown(html)}`
  downloadString(`${sanitizeFilename(title)}.md`, md, "text/markdown")
}

export async function exportAsPDF(editor: Editor, title: string) {
  const html = editor.getHTML()

  const mod = await import("html2pdf.js")
  const html2pdf = mod.default

  // Create container with position:absolute (NOT position:fixed).
  // html2pdf deep-clones this element into its own fixed overlay — if the clone
  // inherits position:fixed it escapes the overlay's capture bounds and html2canvas
  // renders a blank page. position:absolute + left:-9999px keeps it measurable
  // by getBoundingClientRect but doesn't break the clone's positioning.
  const container = document.createElement("div")
  container.classList.add("pdf-export-container")
  container.style.cssText =
    "position:absolute;left:-9999px;top:0;width:800px;background:#fff;padding:40px 20px;" +
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;"
  container.innerHTML =
    `<h1 style="font-size:2em;border-bottom:1px solid #eee;padding-bottom:0.3em">${escapeHtml(title)}</h1>` +
    html

  const style = document.createElement("style")
  style.textContent = `
    .pdf-export-container table { border-collapse:collapse;width:100% }
    .pdf-export-container th,.pdf-export-container td { border:1px solid #ddd;padding:8px 12px;text-align:left }
    .pdf-export-container th { background:#f6f8fa }
    .pdf-export-container pre { background:#f6f8fa;padding:16px;border-radius:6px;overflow-x:auto }
    .pdf-export-container code { background:#f6f8fa;padding:2px 6px;border-radius:3px;font-size:0.9em }
    .pdf-export-container pre code { background:none;padding:0 }
    .pdf-export-container blockquote { border-left:4px solid #ddd;margin-left:0;padding-left:16px;color:#666 }
    .pdf-export-container img { max-width:100% }
    .pdf-export-container a { color:#0366d6 }
    .pdf-export-container h2 { font-size:1.5em }
    .pdf-export-container h3 { font-size:1.25em }
  `
  document.head.appendChild(style)
  document.body.appendChild(container)

  try {
    // Wait one frame so the browser paints/lays out the container
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

    // Two-argument form is more reliable than the chained .set().from().save()
    const worker = html2pdf(container, {
      margin: [10, 10, 10, 10],
      filename: `${sanitizeFilename(title)}.pdf`,
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })

    // html2pdf's Worker overrides .then() with a custom thenable that can
    // resolve before the pipeline finishes. thenExternal() uses native
    // Promise.prototype.then so await resolves only after save completes.
    await (worker as any).thenExternal(() => {})
  } finally {
    if (document.body.contains(container)) document.body.removeChild(container)
    if (document.head.contains(style)) document.head.removeChild(style)
  }
}

// --- Export All as ZIP ---

export async function exportAllAsZip() {
  // Fetch all documents and folders
  const [{ documents }, { folders }] = await Promise.all([
    api.get<{ documents: Document[] }>("/documents"),
    api.get<{ folders: Folder[] }>("/folders"),
  ])

  // Fetch full content for each document (in parallel, batched)
  const fullDocs = await Promise.all(
    documents.map((d) =>
      api.get<{ document: Document }>(`/documents/${d.id}`).then((r) => r.document)
    )
  )

  // Build folder path map
  const folderPathMap = new Map<string, string>()
  function getFolderPath(folderId: string): string {
    if (folderPathMap.has(folderId)) return folderPathMap.get(folderId)!
    const folder = folders.find((f) => f.id === folderId)
    if (!folder) return ""
    const parentPath = folder.parentId ? getFolderPath(folder.parentId) : ""
    const path = parentPath
      ? `${parentPath}/${sanitizeFilename(folder.name)}`
      : sanitizeFilename(folder.name)
    folderPathMap.set(folderId, path)
    return path
  }

  // Pre-compute all folder paths
  folders.forEach((f) => getFolderPath(f.id))

  const zip = new JSZip()
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  })

  for (const doc of fullDocs) {
    const safeName = sanitizeFilename(doc.title)
    const folderPath = doc.folderId ? getFolderPath(doc.folderId) : ""
    const prefix = folderPath ? `${folderPath}/` : ""

    // Convert content to HTML — for TipTap JSON content, we need to handle it
    // The content is TipTap JSON; we can't easily render it server-side
    // So we store the raw JSON and also a simple text extraction
    let htmlBody = ""
    if (doc.content && typeof doc.content === "object") {
      // Try to extract text from TipTap JSON
      htmlBody = tiptapJsonToHtml(doc.content)
    }

    const fullHtml = getStyledHTML(doc.title, htmlBody)
    const md = `# ${doc.title}\n\n${turndown.turndown(htmlBody || "<p></p>")}`

    zip.file(`${prefix}${safeName}.html`, fullHtml)
    zip.file(`${prefix}${safeName}.md`, md)
  }

  const blob = await zip.generateAsync({ type: "blob" })
  downloadBlob(blob, "documents-export.zip")
}

// Simple TipTap JSON to HTML converter (handles common node types)
function tiptapJsonToHtml(json: unknown): string {
  if (!json || typeof json !== "object") return ""
  const node = json as { type?: string; content?: unknown[]; text?: string; attrs?: Record<string, unknown>; marks?: { type: string; attrs?: Record<string, unknown> }[] }

  if (node.type === "text") {
    let text = escapeHtml(node.text || "")
    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.type === "bold") text = `<strong>${text}</strong>`
        else if (mark.type === "italic") text = `<em>${text}</em>`
        else if (mark.type === "underline") text = `<u>${text}</u>`
        else if (mark.type === "strike") text = `<s>${text}</s>`
        else if (mark.type === "code") text = `<code>${text}</code>`
        else if (mark.type === "link") text = `<a href="${escapeHtml(String(mark.attrs?.href || ""))}">${text}</a>`
        else if (mark.type === "highlight") text = `<mark>${text}</mark>`
      }
    }
    return text
  }

  const children = (node.content || []).map((c) => tiptapJsonToHtml(c)).join("")

  switch (node.type) {
    case "doc":
      return children
    case "paragraph":
      return `<p>${children || "<br>"}</p>`
    case "heading": {
      const level = node.attrs?.level || 1
      return `<h${level}>${children}</h${level}>`
    }
    case "bulletList":
      return `<ul>${children}</ul>`
    case "orderedList":
      return `<ol>${children}</ol>`
    case "listItem":
      return `<li>${children}</li>`
    case "blockquote":
      return `<blockquote>${children}</blockquote>`
    case "codeBlock":
      return `<pre><code>${children}</code></pre>`
    case "horizontalRule":
      return "<hr>"
    case "hardBreak":
      return "<br>"
    case "image":
      return `<img src="${escapeHtml(String(node.attrs?.src || ""))}" alt="${escapeHtml(String(node.attrs?.alt || ""))}" />`
    case "table":
      return `<table>${children}</table>`
    case "tableRow":
      return `<tr>${children}</tr>`
    case "tableCell":
      return `<td>${children}</td>`
    case "tableHeader":
      return `<th>${children}</th>`
    default:
      return children
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
