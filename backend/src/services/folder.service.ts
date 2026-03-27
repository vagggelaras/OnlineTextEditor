import { prisma } from "../config/database";
import { NotFoundError, ForbiddenError } from "../utils/errors";

export async function getFolders(userId: string) {
  return prisma.folder.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      parentId: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createFolder(userId: string, data: { name: string; parentId?: string }) {
  // Set sortOrder to put new folder at the end of its parent
  const maxOrder = await prisma.folder.aggregate({
    where: { userId, parentId: data.parentId || null },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  return prisma.folder.create({
    data: {
      name: data.name,
      parentId: data.parentId || null,
      sortOrder,
      userId,
    },
    select: {
      id: true,
      name: true,
      parentId: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateFolder(id: string, userId: string, data: { name?: string; parentId?: string | null; sortOrder?: number }) {
  const folder = await prisma.folder.findUnique({ where: { id } });
  if (!folder) throw new NotFoundError("Folder not found");
  if (folder.userId !== userId) throw new ForbiddenError();

  return prisma.folder.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      parentId: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function reorderFolders(userId: string, items: { id: string; sortOrder: number; parentId: string | null }[]) {
  await Promise.all(
    items.map((item) =>
      prisma.folder.updateMany({
        where: { id: item.id, userId },
        data: { sortOrder: item.sortOrder, parentId: item.parentId },
      })
    )
  );
}

export async function deleteFolder(id: string, userId: string) {
  const folder = await prisma.folder.findUnique({ where: { id } });
  if (!folder) throw new NotFoundError("Folder not found");
  if (folder.userId !== userId) throw new ForbiddenError();

  // Delete all documents in this folder first
  await prisma.document.deleteMany({ where: { folderId: id, userId } });
  // Delete child folders recursively
  const children = await prisma.folder.findMany({ where: { parentId: id, userId } });
  for (const child of children) {
    await deleteFolder(child.id, userId);
  }
  await prisma.folder.delete({ where: { id } });
}
