import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentStore } from "@/stores/documentStore";
import {
  FileText,
  FolderClosed,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Trash2,
  Pencil,
  Plus,
  FolderPlus,
  GripVertical,
} from "lucide-react";
import type { Folder, Document } from "@/types/document";

interface FileTreeProps {
  onOpenDocument: (id: string) => void;
  activeDocId?: string;
}

// Drag data passed via dataTransfer
interface DragPayload {
  type: "document" | "folder";
  id: string;
  fromFolderId: string | null;
}

export function FileTree({ onOpenDocument, activeDocId }: FileTreeProps) {
  const {
    documents,
    folders,
    deleteDocument,
    deleteFolder,
    updateDocument,
    updateFolder,
    createDocument,
    createFolder,
    reorderDocuments,
    reorderFolders,
  } = useDocumentStore();
  const navigate = useNavigate();

  // Drag state
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<"before" | "inside" | "after" | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, payload: DragPayload) => {
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetId: string, targetType: "folder" | "document" | "root") => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    if (targetType === "folder") {
      if (y < height * 0.25) {
        setDropPosition("before");
      } else if (y > height * 0.75) {
        setDropPosition("after");
      } else {
        setDropPosition("inside");
      }
    } else if (targetType === "document") {
      setDropPosition(y < height * 0.5 ? "before" : "after");
    } else {
      setDropPosition("inside");
    }

    setDragOverTarget(targetId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if leaving the actual element (not entering a child)
    const related = e.relatedTarget as HTMLElement | null;
    if (!related || !(e.currentTarget as HTMLElement).contains(related)) {
      setDragOverTarget(null);
      setDropPosition(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string, targetFolderId: string | null, targetType: "folder" | "document" | "root", targetSortOrder: number) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverTarget(null);
      setDropPosition(null);

      let payload: DragPayload;
      try {
        payload = JSON.parse(e.dataTransfer.getData("application/json"));
      } catch {
        return;
      }

      // Prevent dropping folder on itself or its children
      if (payload.type === "folder" && payload.id === targetId) return;

      if (payload.type === "document") {
        let newFolderId: string | null;
        let siblingDocs: Document[];

        if (targetType === "root" || (targetType === "folder" && dropPosition === "inside")) {
          newFolderId = targetType === "root" ? null : targetId;
          siblingDocs = documents
            .filter((d) => d.folderId === newFolderId)
            .sort((a, b) => a.sortOrder - b.sortOrder);
        } else if (targetType === "folder") {
          // Dropping before/after a folder — place at same parent level
          const targetFolder = folders.find((f) => f.id === targetId);
          newFolderId = targetFolder?.parentId ?? null;
          siblingDocs = documents
            .filter((d) => d.folderId === newFolderId)
            .sort((a, b) => a.sortOrder - b.sortOrder);
        } else {
          // Dropping before/after a document
          newFolderId = targetFolderId;
          siblingDocs = documents
            .filter((d) => d.folderId === newFolderId)
            .sort((a, b) => a.sortOrder - b.sortOrder);
        }

        // Remove the dragged doc from siblings if it's in the same folder
        const filtered = siblingDocs.filter((d) => d.id !== payload.id);

        // Find insert index
        let insertIndex: number;
        if (targetType === "document") {
          const targetIndex = filtered.findIndex((d) => d.id === targetId);
          insertIndex = dropPosition === "before" ? targetIndex : targetIndex + 1;
          if (insertIndex < 0) insertIndex = filtered.length;
        } else {
          insertIndex = filtered.length; // drop inside folder = append at end
        }

        // Build reorder list
        const reordered: { id: string; sortOrder: number; folderId: string | null }[] = [];
        let order = 0;
        for (let i = 0; i < filtered.length; i++) {
          if (i === insertIndex) {
            reordered.push({ id: payload.id, sortOrder: order++, folderId: newFolderId });
          }
          reordered.push({ id: filtered[i].id, sortOrder: order++, folderId: newFolderId });
        }
        if (insertIndex >= filtered.length) {
          reordered.push({ id: payload.id, sortOrder: order++, folderId: newFolderId });
        }

        reorderDocuments(reordered);
      } else if (payload.type === "folder") {
        let newParentId: string | null;
        let siblingFolders: Folder[];

        if (targetType === "root" || (targetType === "folder" && dropPosition === "inside")) {
          newParentId = targetType === "root" ? null : targetId;
          siblingFolders = folders
            .filter((f) => f.parentId === newParentId)
            .sort((a, b) => a.sortOrder - b.sortOrder);
        } else if (targetType === "folder") {
          const targetFolder = folders.find((f) => f.id === targetId);
          newParentId = targetFolder?.parentId ?? null;
          siblingFolders = folders
            .filter((f) => f.parentId === newParentId)
            .sort((a, b) => a.sortOrder - b.sortOrder);
        } else {
          // Dropping before/after a document — same parent folder
          newParentId = targetFolderId;
          siblingFolders = folders
            .filter((f) => f.parentId === newParentId)
            .sort((a, b) => a.sortOrder - b.sortOrder);
        }

        // Prevent dropping a folder into its own descendant
        if (isDescendant(folders, payload.id, newParentId)) return;

        const filtered = siblingFolders.filter((f) => f.id !== payload.id);

        let insertIndex: number;
        if (targetType === "folder" && dropPosition !== "inside") {
          const targetIndex = filtered.findIndex((f) => f.id === targetId);
          insertIndex = dropPosition === "before" ? targetIndex : targetIndex + 1;
          if (insertIndex < 0) insertIndex = filtered.length;
        } else {
          insertIndex = filtered.length;
        }

        const reordered: { id: string; sortOrder: number; parentId: string | null }[] = [];
        let order = 0;
        for (let i = 0; i < filtered.length; i++) {
          if (i === insertIndex) {
            reordered.push({ id: payload.id, sortOrder: order++, parentId: newParentId });
          }
          reordered.push({ id: filtered[i].id, sortOrder: order++, parentId: newParentId });
        }
        if (insertIndex >= filtered.length) {
          reordered.push({ id: payload.id, sortOrder: order++, parentId: newParentId });
        }

        reorderFolders(reordered);
      }
    },
    [documents, folders, dropPosition, reorderDocuments, reorderFolders]
  );

  const sortedRootFolders = folders
    .filter((f) => f.parentId === null)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const sortedRootDocs = documents
    .filter((d) => d.folderId === null)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div
      className="py-1"
      onDragOver={(e) => handleDragOver(e, "root", "root")}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, "root", null, "root", 0)}
    >
      {sortedRootFolders.map((f) => (
        <FolderNode
          key={f.id}
          folder={f}
          folders={folders}
          documents={documents}
          onOpenDocument={onOpenDocument}
          activeDocId={activeDocId}
          deleteDocument={deleteDocument}
          deleteFolder={deleteFolder}
          updateDocument={updateDocument}
          updateFolder={updateFolder}
          createDocument={createDocument}
          createFolder={createFolder}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          dragOverTarget={dragOverTarget}
          dropPosition={dropPosition}
          navigate={navigate}
        />
      ))}
      {sortedRootDocs.map((doc) => (
        <DocItem
          key={doc.id}
          doc={doc}
          active={doc.id === activeDocId}
          onOpen={() => onOpenDocument(doc.id)}
          onDelete={() => deleteDocument(doc.id)}
          onRename={(title) => updateDocument(doc.id, { title })}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          dragOverTarget={dragOverTarget}
          dropPosition={dropPosition}
        />
      ))}
    </div>
  );
}

function isDescendant(folders: Folder[], folderId: string, targetParentId: string | null): boolean {
  let current = targetParentId;
  while (current) {
    if (current === folderId) return true;
    const parent = folders.find((f) => f.id === current);
    current = parent?.parentId ?? null;
  }
  return false;
}

interface FolderNodeProps {
  folder: Folder;
  folders: Folder[];
  documents: Document[];
  onOpenDocument: (id: string) => void;
  activeDocId?: string;
  deleteDocument: (id: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  updateDocument: (id: string, data: { title?: string }) => Promise<void>;
  updateFolder: (id: string, data: { name?: string }) => Promise<void>;
  createDocument: (data?: { title?: string; folderId?: string }) => Promise<Document>;
  createFolder: (data: { name: string; parentId?: string }) => Promise<void>;
  onDragStart: (e: React.DragEvent, payload: DragPayload) => void;
  onDragOver: (e: React.DragEvent, targetId: string, targetType: "folder" | "document" | "root") => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId: string, targetFolderId: string | null, targetType: "folder" | "document" | "root", targetSortOrder: number) => void;
  dragOverTarget: string | null;
  dropPosition: "before" | "inside" | "after" | null;
  navigate: (path: string) => void;
}

function FolderNode({
  folder,
  folders,
  documents,
  onOpenDocument,
  activeDocId,
  deleteDocument,
  deleteFolder,
  updateDocument,
  updateFolder,
  createDocument,
  createFolder,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  dragOverTarget,
  dropPosition,
  navigate,
}: FolderNodeProps) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [showActions, setShowActions] = useState(false);
  const [creatingSubfolder, setCreatingSubfolder] = useState(false);
  const [subfolderName, setSubfolderName] = useState("");

  const childFolders = folders
    .filter((f) => f.parentId === folder.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const childDocs = documents
    .filter((d) => d.folderId === folder.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const handleRenameFolder = () => {
    if (editName.trim()) {
      updateFolder(folder.id, { name: editName.trim() });
    }
    setEditing(false);
  };

  const handleCreateSubfolder = async () => {
    if (subfolderName.trim()) {
      await createFolder({ name: subfolderName.trim(), parentId: folder.id });
      setSubfolderName("");
      setCreatingSubfolder(false);
      setOpen(true);
    }
  };

  const handleCreateDocInside = async () => {
    const doc = await createDocument({ folderId: folder.id });
    setOpen(true);
    navigate(`/editor/${doc.id}`);
  };

  const isDropTarget = dragOverTarget === folder.id;
  const dropIndicatorClass =
    isDropTarget && dropPosition === "inside"
      ? "ring-2 ring-primary/50 bg-primary/5"
      : "";
  const showTopLine = isDropTarget && dropPosition === "before";
  const showBottomLine = isDropTarget && dropPosition === "after";

  return (
    <div>
      {showTopLine && <div className="h-0.5 bg-primary rounded-full mx-2" />}
      <div
        className={`flex items-center gap-1 px-1 py-1 text-sm rounded-md hover:bg-accent cursor-pointer group ${dropIndicatorClass}`}
        draggable
        onDragStart={(e) => onDragStart(e, { type: "folder", id: folder.id, fromFolderId: folder.parentId })}
        onDragOver={(e) => onDragOver(e, folder.id, "folder")}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, folder.id, folder.parentId, "folder", folder.sortOrder)}
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground/40 opacity-0 group-hover:opacity-100 cursor-grab" />
        {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
        {open ? <FolderOpen className="h-4 w-4 shrink-0 text-amber-500" /> : <FolderClosed className="h-4 w-4 shrink-0 text-amber-500" />}
        {editing ? (
          <input
            className="flex-1 bg-transparent border-b border-primary text-sm outline-none"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRenameFolder}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameFolder();
              if (e.key === "Escape") setEditing(false);
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <span className="flex-1 truncate">{folder.name}</span>
        )}
        {showActions && !editing && (
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <button
              className="p-0.5 rounded hover:bg-muted"
              title="New document inside"
              onClick={handleCreateDocInside}
            >
              <Plus className="h-3 w-3" />
            </button>
            <button
              className="p-0.5 rounded hover:bg-muted"
              title="New subfolder"
              onClick={() => { setCreatingSubfolder(true); setOpen(true); }}
            >
              <FolderPlus className="h-3 w-3" />
            </button>
            <button
              className="p-0.5 rounded hover:bg-muted"
              onClick={() => { setEditName(folder.name); setEditing(true); }}
              title="Rename"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              className="p-0.5 rounded hover:bg-muted text-destructive"
              onClick={() => { if (confirm("Delete this folder and all its contents?")) deleteFolder(folder.id); }}
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
      {showBottomLine && <div className="h-0.5 bg-primary rounded-full mx-2" />}
      {open && (
        <div className="ml-3 border-l border-border pl-1">
          {creatingSubfolder && (
            <div className="px-2 py-1">
              <input
                className="w-full text-xs border border-input rounded px-2 py-1 bg-background outline-none focus:ring-1 focus:ring-ring"
                placeholder="Folder name..."
                value={subfolderName}
                onChange={(e) => setSubfolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateSubfolder();
                  if (e.key === "Escape") setCreatingSubfolder(false);
                }}
                onBlur={() => { if (!subfolderName.trim()) setCreatingSubfolder(false); }}
                autoFocus
              />
            </div>
          )}
          {childFolders.map((f) => (
            <FolderNode
              key={f.id}
              folder={f}
              folders={folders}
              documents={documents}
              onOpenDocument={onOpenDocument}
              activeDocId={activeDocId}
              deleteDocument={deleteDocument}
              deleteFolder={deleteFolder}
              updateDocument={updateDocument}
              updateFolder={updateFolder}
              createDocument={createDocument}
              createFolder={createFolder}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              dragOverTarget={dragOverTarget}
              dropPosition={dropPosition}
              navigate={navigate}
            />
          ))}
          {childDocs.map((doc) => (
            <DocItem
              key={doc.id}
              doc={doc}
              active={doc.id === activeDocId}
              onOpen={() => onOpenDocument(doc.id)}
              onDelete={() => deleteDocument(doc.id)}
              onRename={(title) => updateDocument(doc.id, { title })}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              dragOverTarget={dragOverTarget}
              dropPosition={dropPosition}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface DocItemProps {
  doc: Document;
  active: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
  onDragStart: (e: React.DragEvent, payload: DragPayload) => void;
  onDragOver: (e: React.DragEvent, targetId: string, targetType: "folder" | "document" | "root") => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId: string, targetFolderId: string | null, targetType: "folder" | "document" | "root", targetSortOrder: number) => void;
  dragOverTarget: string | null;
  dropPosition: "before" | "inside" | "after" | null;
}

function DocItem({
  doc,
  active,
  onOpen,
  onDelete,
  onRename,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  dragOverTarget,
  dropPosition,
}: DocItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");

  const handleRename = () => {
    if (editTitle.trim()) onRename(editTitle.trim());
    setEditing(false);
  };

  const isDropTarget = dragOverTarget === doc.id;
  const showTopLine = isDropTarget && dropPosition === "before";
  const showBottomLine = isDropTarget && dropPosition === "after";

  return (
    <>
      {showTopLine && <div className="h-0.5 bg-primary rounded-full mx-2" />}
      <div
        className={`flex items-center gap-1 px-1 py-1 text-sm rounded-md cursor-pointer group ${
          active ? "bg-accent text-accent-foreground" : "hover:bg-accent"
        }`}
        draggable
        onDragStart={(e) => onDragStart(e, { type: "document", id: doc.id, fromFolderId: doc.folderId })}
        onDragOver={(e) => onDragOver(e, doc.id, "document")}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, doc.id, doc.folderId, "document", doc.sortOrder)}
        onClick={onOpen}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground/40 opacity-0 group-hover:opacity-100 cursor-grab" />
        <FileText className="h-4 w-4 shrink-0 text-blue-500" />
        {editing ? (
          <input
            className="flex-1 bg-transparent border-b border-primary text-sm outline-none"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") setEditing(false);
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <span className="flex-1 truncate">{doc.title}</span>
        )}
        {showActions && !editing && (
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <button
              className="p-0.5 rounded hover:bg-muted"
              onClick={() => { setEditTitle(doc.title); setEditing(true); }}
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              className="p-0.5 rounded hover:bg-muted text-destructive"
              onClick={() => { if (confirm("Delete this document?")) onDelete(); }}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
      {showBottomLine && <div className="h-0.5 bg-primary rounded-full mx-2" />}
    </>
  );
}
