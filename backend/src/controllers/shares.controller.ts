import { Request, Response } from "express";
import * as shareService from "../services/share.service";

export async function getShares(req: Request, res: Response) {
  const shares = await shareService.getShares(req.params.documentId as string, req.user!.userId);
  res.json({ shares });
}

export async function createShare(req: Request, res: Response) {
  const share = await shareService.createShare(
    req.params.documentId as string,
    req.user!.userId,
    req.body
  );
  res.status(201).json({ share });
}

export async function updateShare(req: Request, res: Response) {
  const share = await shareService.updateShare(
    req.params.id as string,
    req.params.documentId as string,
    req.user!.userId,
    req.body
  );
  res.json({ share });
}

export async function deleteShare(req: Request, res: Response) {
  await shareService.deleteShare(
    req.params.id as string,
    req.params.documentId as string,
    req.user!.userId
  );
  res.json({ message: "Share link deleted" });
}

export async function getSharedDocument(req: Request, res: Response) {
  const result = await shareService.getDocumentByShareToken(req.params.token as string);
  res.json(result);
}
