import { Request, Response } from "express";
import * as folderService from "../services/folder.service";

export async function getFolders(req: Request, res: Response) {
  const folders = await folderService.getFolders(req.user!.userId);
  res.json({ folders });
}

export async function createFolder(req: Request, res: Response) {
  const folder = await folderService.createFolder(req.user!.userId, req.body);
  res.status(201).json({ folder });
}

export async function updateFolder(req: Request, res: Response) {
  const folder = await folderService.updateFolder(req.params.id as string, req.user!.userId, req.body);
  res.json({ folder });
}

export async function deleteFolder(req: Request, res: Response) {
  await folderService.deleteFolder(req.params.id as string, req.user!.userId);
  res.json({ message: "Folder deleted" });
}

export async function reorderFolders(req: Request, res: Response) {
  await folderService.reorderFolders(req.user!.userId, req.body.items);
  res.json({ message: "Folders reordered" });
}
