import type { Editor } from "@tiptap/react"
import { Toggle } from "@/components/ui/toggle"
import { Separator } from "@/components/ui/separator"
import { Tooltip } from "@/components/ui/tooltip"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Undo,
  Redo,
  Table,
  Image,
  Link,
  Unlink,
  RemoveFormatting,
  BarChart3,
  History,
} from "lucide-react"
import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface EditorToolbarProps {
  editor: Editor | null
  onToggleCharts?: () => void
  chartPanelOpen?: boolean
  onToggleVersions?: () => void
  versionPanelOpen?: boolean
}

function ToolbarButton({
  onClick,
  pressed,
  tooltip,
  children,
  disabled,
}: {
  onClick: () => void
  pressed?: boolean
  tooltip: string
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <Tooltip content={tooltip}>
      <Toggle
        size="sm"
        pressed={pressed}
        onClick={onClick}
        disabled={disabled}
        className="h-8 w-8 p-0"
      >
        {children}
      </Toggle>
    </Tooltip>
  )
}

export function EditorToolbar({ editor, onToggleCharts, chartPanelOpen, onToggleVersions, versionPanelOpen }: EditorToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")

  const setLink = useCallback(() => {
    if (!editor) return
    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run()
    }
    setShowLinkInput(false)
    setLinkUrl("")
  }, [editor, linkUrl])

  const addImage = useCallback(() => {
    if (!editor) return
    const url = window.prompt("Image URL:")
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addTable = useCallback(() => {
    if (!editor) return
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run()
  }, [editor])

  if (!editor) return null

  return (
    <div className="border-b border-border bg-background sticky top-0 z-10">
      <div className="flex flex-wrap items-center gap-0.5 p-1">
        {/* Undo / Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          tooltip="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          tooltip="Redo (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          pressed={editor.isActive("bold")}
          tooltip="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          pressed={editor.isActive("italic")}
          tooltip="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          pressed={editor.isActive("underline")}
          tooltip="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          pressed={editor.isActive("strike")}
          tooltip="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          pressed={editor.isActive("code")}
          tooltip="Inline Code"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          pressed={editor.isActive("highlight")}
          tooltip="Highlight"
        >
          <Highlighter className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          pressed={editor.isActive("heading", { level: 1 })}
          tooltip="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          pressed={editor.isActive("heading", { level: 2 })}
          tooltip="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          pressed={editor.isActive("heading", { level: 3 })}
          tooltip="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          pressed={editor.isActive("bulletList")}
          tooltip="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          pressed={editor.isActive("orderedList")}
          tooltip="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          pressed={editor.isActive("blockquote")}
          tooltip="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          tooltip="Horizontal Rule"
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Text Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          pressed={editor.isActive({ textAlign: "left" })}
          tooltip="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          pressed={editor.isActive({ textAlign: "center" })}
          tooltip="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          pressed={editor.isActive({ textAlign: "right" })}
          tooltip="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          pressed={editor.isActive({ textAlign: "justify" })}
          tooltip="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Insert */}
        <ToolbarButton onClick={addTable} tooltip="Insert Table">
          <Table className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={addImage} tooltip="Insert Image">
          <Image className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            if (editor.isActive("link")) {
              editor.chain().focus().unsetLink().run()
            } else {
              setShowLinkInput(true)
              setLinkUrl(editor.getAttributes("link").href || "")
            }
          }}
          pressed={editor.isActive("link")}
          tooltip={editor.isActive("link") ? "Remove Link" : "Add Link"}
        >
          {editor.isActive("link") ? (
            <Unlink className="h-4 w-4" />
          ) : (
            <Link className="h-4 w-4" />
          )}
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Clear formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          tooltip="Clear Formatting"
        >
          <RemoveFormatting className="h-4 w-4" />
        </ToolbarButton>

        {onToggleCharts && (
          <>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <ToolbarButton
              onClick={onToggleCharts}
              pressed={chartPanelOpen}
              tooltip="Charts"
            >
              <BarChart3 className="h-4 w-4" />
            </ToolbarButton>
          </>
        )}

        {onToggleVersions && (
          <ToolbarButton
            onClick={onToggleVersions}
            pressed={versionPanelOpen}
            tooltip="Version History"
          >
            <History className="h-4 w-4" />
          </ToolbarButton>
        )}
      </div>

      {/* Link input bar */}
      {showLinkInput && (
        <div className="flex items-center gap-2 border-t border-border px-2 py-1.5">
          <Input
            type="url"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setLink()
              if (e.key === "Escape") setShowLinkInput(false)
            }}
            className="h-8 text-sm"
            autoFocus
          />
          <Button size="sm" className="h-8" onClick={setLink}>
            Apply
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8"
            onClick={() => setShowLinkInput(false)}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Table controls - shown when cursor is in a table */}
      {editor.isActive("table") && (
        <div className="flex items-center gap-1 border-t border-border px-2 py-1">
          <span className="text-xs text-muted-foreground mr-2">Table:</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
          >
            + Col Before
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          >
            + Col After
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => editor.chain().focus().deleteColumn().run()}
          >
            - Col
          </Button>
          <Separator orientation="vertical" className="mx-1 h-4" />
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => editor.chain().focus().addRowBefore().run()}
          >
            + Row Before
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => editor.chain().focus().addRowAfter().run()}
          >
            + Row After
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => editor.chain().focus().deleteRow().run()}
          >
            - Row
          </Button>
          <Separator orientation="vertical" className="mx-1 h-4" />
          <Button
            size="sm"
            variant="destructive"
            className="h-7 text-xs"
            onClick={() => editor.chain().focus().deleteTable().run()}
          >
            Delete Table
          </Button>
        </div>
      )}
    </div>
  )
}
