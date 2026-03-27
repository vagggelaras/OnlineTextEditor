import crypto from "node:crypto";
import { prisma } from "../config/database";
import { NotFoundError, ForbiddenError } from "../utils/errors";

function generateToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

async function verifyDocumentOwner(documentId: string, userId: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new NotFoundError("Document not found");
  if (doc.userId !== userId) throw new ForbiddenError();
  return doc;
}

export async function getShares(documentId: string, userId: string) {
  await verifyDocumentOwner(documentId, userId);
  return prisma.sharedDocument.findMany({
    where: { documentId },
    select: {
      id: true,
      shareToken: true,
      permission: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createShare(
  documentId: string,
  userId: string,
  data: { permission?: string }
) {
  await verifyDocumentOwner(documentId, userId);
  return prisma.sharedDocument.create({
    data: {
      documentId,
      shareToken: generateToken(),
      permission: data.permission || "view",
    },
    select: {
      id: true,
      shareToken: true,
      permission: true,
      createdAt: true,
    },
  });
}

export async function updateShare(
  id: string,
  documentId: string,
  userId: string,
  data: { permission: string }
) {
  await verifyDocumentOwner(documentId, userId);
  const share = await prisma.sharedDocument.findUnique({ where: { id } });
  if (!share || share.documentId !== documentId) throw new NotFoundError("Share not found");

  return prisma.sharedDocument.update({
    where: { id },
    data: { permission: data.permission },
    select: {
      id: true,
      shareToken: true,
      permission: true,
      createdAt: true,
    },
  });
}

export async function deleteShare(id: string, documentId: string, userId: string) {
  await verifyDocumentOwner(documentId, userId);
  const share = await prisma.sharedDocument.findUnique({ where: { id } });
  if (!share || share.documentId !== documentId) throw new NotFoundError("Share not found");
  await prisma.sharedDocument.delete({ where: { id } });
}

export async function getDocumentByShareToken(token: string) {
  const share = await prisma.sharedDocument.findUnique({
    where: { shareToken: token },
    include: {
      document: {
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!share) throw new NotFoundError("Shared document not found");

  return {
    document: share.document,
    permission: share.permission,
  };
}
