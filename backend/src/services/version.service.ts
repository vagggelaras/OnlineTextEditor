import { prisma } from "../config/database";
import { NotFoundError, ForbiddenError } from "../utils/errors";

async function verifyDocumentOwner(documentId: string, userId: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new NotFoundError("Document not found");
  if (doc.userId !== userId) throw new ForbiddenError();
  return doc;
}

export async function getVersions(documentId: string, userId: string) {
  await verifyDocumentOwner(documentId, userId);
  return prisma.version.findMany({
    where: { documentId },
    select: {
      id: true,
      label: true,
      createdAt: true,
      createdBy: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getVersion(id: string, documentId: string, userId: string) {
  await verifyDocumentOwner(documentId, userId);
  const version = await prisma.version.findUnique({ where: { id } });
  if (!version || version.documentId !== documentId) throw new NotFoundError("Version not found");
  return version;
}

export async function createVersion(
  documentId: string,
  userId: string,
  data: { label?: string }
) {
  const doc = await verifyDocumentOwner(documentId, userId);

  return prisma.version.create({
    data: {
      documentId,
      content: doc.content || {},
      yjsState: doc.yjsState,
      label: data.label || null,
      createdBy: userId,
    },
    select: {
      id: true,
      label: true,
      createdAt: true,
      createdBy: true,
    },
  });
}

export async function restoreVersion(id: string, documentId: string, userId: string) {
  await verifyDocumentOwner(documentId, userId);
  const version = await prisma.version.findUnique({ where: { id } });
  if (!version || version.documentId !== documentId) throw new NotFoundError("Version not found");

  // Save current state as a version before restoring
  const currentDoc = await prisma.document.findUnique({ where: { id: documentId } });
  if (currentDoc) {
    await prisma.version.create({
      data: {
        documentId,
        content: currentDoc.content || {},
        yjsState: currentDoc.yjsState,
        label: "Auto-saved before restore",
        createdBy: userId,
      },
    });
  }

  // Restore the document to the version's content
  // Clear yjsState so next client syncs will use the JSON content
  return prisma.document.update({
    where: { id: documentId },
    data: {
      content: version.content as any,
      yjsState: null,
    },
    select: {
      id: true,
      title: true,
      content: true,
      updatedAt: true,
    },
  });
}

export async function deleteVersion(id: string, documentId: string, userId: string) {
  await verifyDocumentOwner(documentId, userId);
  const version = await prisma.version.findUnique({ where: { id } });
  if (!version || version.documentId !== documentId) throw new NotFoundError("Version not found");
  await prisma.version.delete({ where: { id } });
}
