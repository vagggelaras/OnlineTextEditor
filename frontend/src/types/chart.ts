export type ChartType = "bar" | "line" | "pie" | "doughnut" | "radar" | "polarArea";

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface Chart {
  id: string;
  documentId: string;
  type: ChartType;
  config: Record<string, unknown>;
  data: ChartData;
  createdAt: string;
  updatedAt: string;
}
