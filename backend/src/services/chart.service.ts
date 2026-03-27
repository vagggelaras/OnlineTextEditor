import { prisma } from "../config/database";
import { NotFoundError, ForbiddenError } from "../utils/errors";

async function verifyDocumentOwner(documentId: string, userId: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new NotFoundError("Document not found");
  if (doc.userId !== userId) throw new ForbiddenError();
  return doc;
}

export async function getCharts(documentId: string, userId: string) {
  await verifyDocumentOwner(documentId, userId);
  return prisma.chart.findMany({
    where: { documentId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getChart(id: string, documentId: string, userId: string) {
  await verifyDocumentOwner(documentId, userId);
  const chart = await prisma.chart.findUnique({ where: { id } });
  if (!chart || chart.documentId !== documentId) throw new NotFoundError("Chart not found");
  return chart;
}

export async function createChart(
  documentId: string,
  userId: string,
  data: { type: string; config: unknown; data: unknown }
) {
  await verifyDocumentOwner(documentId, userId);
  return prisma.chart.create({
    data: {
      documentId,
      type: data.type,
      config: data.config as any,
      data: data.data as any,
    },
  });
}

export async function updateChart(
  id: string,
  documentId: string,
  userId: string,
  data: { type?: string; config?: unknown; data?: unknown }
) {
  await verifyDocumentOwner(documentId, userId);
  const chart = await prisma.chart.findUnique({ where: { id } });
  if (!chart || chart.documentId !== documentId) throw new NotFoundError("Chart not found");

  return prisma.chart.update({
    where: { id },
    data: {
      ...(data.type !== undefined && { type: data.type }),
      ...(data.config !== undefined && { config: data.config as any }),
      ...(data.data !== undefined && { data: data.data as any }),
    },
  });
}

export async function deleteChart(id: string, documentId: string, userId: string) {
  await verifyDocumentOwner(documentId, userId);
  const chart = await prisma.chart.findUnique({ where: { id } });
  if (!chart || chart.documentId !== documentId) throw new NotFoundError("Chart not found");
  await prisma.chart.delete({ where: { id } });
}
