import { Request, Response } from "express";
import * as versionService from "../services/version.service";

export async function getVersions(req: Request, res: Response) {
  const versions = await versionService.getVersions(
    req.params.documentId as string,
    req.user!.userId
  );
  res.json({ versions });
}

export async function getVersion(req: Request, res: Response) {
  const version = await versionService.getVersion(
    req.params.id as string,
    req.params.documentId as string,
    req.user!.userId
  );
  res.json({ version });
}

export async function createVersion(req: Request, res: Response) {
  const version = await versionService.createVersion(
    req.params.documentId as string,
    req.user!.userId,
    req.body
  );
  res.status(201).json({ version });
}

export async function restoreVersion(req: Request, res: Response) {
  const document = await versionService.restoreVersion(
    req.params.id as string,
    req.params.documentId as string,
    req.user!.userId
  );
  res.json({ document, message: "Version restored" });
}

export async function deleteVersion(req: Request, res: Response) {
  await versionService.deleteVersion(
    req.params.id as string,
    req.params.documentId as string,
    req.user!.userId
  );
  res.json({ message: "Version deleted" });
}
