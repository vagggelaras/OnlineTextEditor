import { Request, Response } from "express";
import * as chartService from "../services/chart.service";
import { createChartSchema, updateChartSchema } from "../utils/validation";
import { BadRequestError } from "../utils/errors";

export async function getCharts(req: Request, res: Response) {
  const charts = await chartService.getCharts(req.params.documentId as string, req.user!.userId);
  res.json({ charts });
}

export async function getChart(req: Request, res: Response) {
  const chart = await chartService.getChart(
    req.params.id as string,
    req.params.documentId as string,
    req.user!.userId
  );
  res.json({ chart });
}

export async function createChart(req: Request, res: Response) {
  const parsed = createChartSchema.safeParse(req.body);
  if (!parsed.success) throw new BadRequestError(parsed.error.issues[0].message);

  const chart = await chartService.createChart(
    req.params.documentId as string,
    req.user!.userId,
    parsed.data
  );
  res.status(201).json({ chart });
}

export async function updateChart(req: Request, res: Response) {
  const parsed = updateChartSchema.safeParse(req.body);
  if (!parsed.success) throw new BadRequestError(parsed.error.issues[0].message);

  const chart = await chartService.updateChart(
    req.params.id as string,
    req.params.documentId as string,
    req.user!.userId,
    parsed.data
  );
  res.json({ chart });
}

export async function deleteChart(req: Request, res: Response) {
  await chartService.deleteChart(
    req.params.id as string,
    req.params.documentId as string,
    req.user!.userId
  );
  res.json({ message: "Chart deleted" });
}
