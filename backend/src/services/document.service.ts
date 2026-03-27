import { prisma } from "../config/database";
import { NotFoundError, ForbiddenError } from "../utils/errors";

export async function getDocuments(userId: string) {
  return prisma.document.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      folderId: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getDocument(id: string, userId: string) {
  const doc = await prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      folderId: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!doc) throw new NotFoundError("Document not found");
  if (doc.userId !== userId) throw new ForbiddenError();

  return doc;
}

export async function createDocument(userId: string, data: { title?: string; folderId?: string }) {
  const maxOrder = await prisma.document.aggregate({
    where: { userId, folderId: data.folderId || null },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  return prisma.document.create({
    data: {
      title: data.title || "Untitled Document",
      folderId: data.folderId || null,
      sortOrder,
      userId,
    },
    select: {
      id: true,
      title: true,
      folderId: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateDocument(id: string, userId: string, data: { title?: string; folderId?: string | null; sortOrder?: number }) {
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) throw new NotFoundError("Document not found");
  if (doc.userId !== userId) throw new ForbiddenError();

  return prisma.document.update({
    where: { id },
    data,
    select: {
      id: true,
      title: true,
      folderId: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function reorderDocuments(userId: string, items: { id: string; sortOrder: number; folderId: string | null }[]) {
  await Promise.all(
    items.map((item) =>
      prisma.document.updateMany({
        where: { id: item.id, userId },
        data: { sortOrder: item.sortOrder, folderId: item.folderId },
      })
    )
  );
}

export async function updateDocumentContent(id: string, userId: string, content: unknown) {
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) throw new NotFoundError("Document not found");
  if (doc.userId !== userId) throw new ForbiddenError();

  return prisma.document.update({
    where: { id },
    data: { content: content as any },
    select: { id: true, updatedAt: true },
  });
}

export async function deleteDocument(id: string, userId: string) {
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) throw new NotFoundError("Document not found");
  if (doc.userId !== userId) throw new ForbiddenError();

  await prisma.document.delete({ where: { id } });
}
