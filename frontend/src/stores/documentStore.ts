import { create } from "zustand";
import type { Document, Folder } from "@/types/document";
import { api } from "@/lib/api";

interface DocumentState {
  documents: Document[];
  folders: Folder[];
  currentDoc: Document | null;
  loading: boolean;

  fetchDocuments: () => Promise<void>;
  fetchFolders: () => Promise<void>;
  fetchAll: () => Promise<void>;

  createDocument: (data?: { title?: string; folderId?: string }) => Promise<Document>;
  updateDocument: (id: string, data: { title?: string; folderId?: string | null }) => Promise<void>;
  saveContent: (id: string, content: unknown) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  openDocument: (id: string) => Promise<void>;

  createFolder: (data: { name: string; parentId?: string }) => Promise<void>;
  updateFolder: (id: string, data: { name?: string; parentId?: string | null }) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  reorderDocuments: (items: { id: string; sortOrder: number; folderId: string | null }[]) => Promise<void>;
  reorderFolders: (items: { id: string; sortOrder: number; parentId: string | null }[]) => Promise<void>;

  setCurrentDoc: (doc: Document | null) => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  folders: [],
  currentDoc: null,
  loading: false,

  fetchDocuments: async () => {
    const { documents } = await api.get<{ documents: Document[] }>("/documents");
    set({ documents });
  },

  fetchFolders: async () => {
    const { folders } = await api.get<{ folders: Folder[] }>("/folders");
    set({ folders });
  },

  fetchAll: async () => {
    set({ loading: true });
    await Promise.all([get().fetchDocuments(), get().fetchFolders()]);
    set({ loading: false });
  },

  createDocument: async (data) => {
    const { document } = await api.post<{ document: Document }>("/documents", data);
    set((s) => ({ documents: [document, ...s.documents] }));
    return document;
  },

  updateDocument: async (id, data) => {
    const { document } = await api.patch<{ document: Document }>(`/documents/${id}`, data);
    set((s) => ({
      documents: s.documents.map((d) => (d.id === id ? document : d)),
      currentDoc: s.currentDoc?.id === id ? { ...s.currentDoc, ...document } : s.currentDoc,
    }));
  },

  saveContent: async (id, content) => {
    await api.put(`/documents/${id}/content`, { content });
  },

  deleteDocument: async (id) => {
    await api.delete(`/documents/${id}`);
    set((s) => ({
      documents: s.documents.filter((d) => d.id !== id),
      currentDoc: s.currentDoc?.id === id ? null : s.currentDoc,
    }));
  },

  openDocument: async (id) => {
    const { document } = await api.get<{ document: Document }>(`/documents/${id}`);
    set({ currentDoc: document });
  },

  createFolder: async (data) => {
    const { folder } = await api.post<{ folder: Folder }>("/folders", data);
    set((s) => ({ folders: [...s.folders, folder] }));
  },

  updateFolder: async (id, data) => {
    const { folder } = await api.patch<{ folder: Folder }>(`/folders/${id}`, data);
    set((s) => ({ folders: s.folders.map((f) => (f.id === id ? folder : f)) }));
  },

  deleteFolder: async (id) => {
    await api.delete(`/folders/${id}`);
    set((s) => ({ folders: s.folders.filter((f) => f.id !== id) }));
    // Refresh documents since cascade delete may have removed some
    get().fetchDocuments();
  },

  reorderDocuments: async (items) => {
    // Optimistic update
    set((s) => ({
      documents: s.documents.map((d) => {
        const update = items.find((i) => i.id === d.id);
        return update ? { ...d, sortOrder: update.sortOrder, folderId: update.folderId } : d;
      }),
    }));
    await api.patch("/documents/reorder", { items });
  },

  reorderFolders: async (items) => {
    // Optimistic update
    set((s) => ({
      folders: s.folders.map((f) => {
        const update = items.find((i) => i.id === f.id);
        return update ? { ...f, sortOrder: update.sortOrder, parentId: update.parentId } : f;
      }),
    }));
    await api.patch("/folders/reorder", { items });
  },

  setCurrentDoc: (doc) => set({ currentDoc: doc }),
}));
