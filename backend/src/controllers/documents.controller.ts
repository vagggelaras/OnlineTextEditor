import { Request, Response } from "express";
import * as docService from "../services/document.service";

export async function getDocuments(req: Request, res: Response) {
  const docs = await docService.getDocuments(req.user!.userId);
  res.json({ documents: docs });
}

export async function getDocument(req: Request, res: Response) {
  const doc = await docService.getDocument(req.params.id as string, req.user!.userId);
  res.json({ document: doc });
}

export async function createDocument(req: Request, res: Response) {
  const doc = await docService.createDocument(req.user!.userId, req.body);
  res.status(201).json({ document: doc });
}

export async function updateDocument(req: Request, res: Response) {
  const doc = await docService.updateDocument(req.params.id as string, req.user!.userId, req.body);
  res.json({ document: doc });
}

export async function updateDocumentContent(req: Request, res: Response) {
  const result = await docService.updateDocumentContent(req.params.id as string, req.user!.userId, req.body.content);
  res.json(result);
}

export async function deleteDocument(req: Request, res: Response) {
  await docService.deleteDocument(req.params.id as string, req.user!.userId);
  res.json({ message: "Document deleted" });
}

export async function reorderDocuments(req: Request, res: Response) {
  await docService.reorderDocuments(req.user!.userId, req.body.items);
  res.json({ message: "Documents reordered" });
}
