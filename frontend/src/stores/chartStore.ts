import { create } from "zustand";
import type { Chart, ChartType, ChartData } from "@/types/chart";
import { api } from "@/lib/api";

interface ChartState {
  charts: Chart[];
  selectedChart: Chart | null;
  editing: boolean;
  loading: boolean;

  fetchCharts: (documentId: string) => Promise<void>;
  createChart: (documentId: string, data: { type: ChartType; config: Record<string, unknown>; data: ChartData }) => Promise<Chart>;
  updateChart: (documentId: string, chartId: string, data: { type?: ChartType; config?: Record<string, unknown>; data?: ChartData }) => Promise<void>;
  deleteChart: (documentId: string, chartId: string) => Promise<void>;
  selectChart: (chart: Chart | null) => void;
  setEditing: (editing: boolean) => void;
}

export const useChartStore = create<ChartState>((set) => ({
  charts: [],
  selectedChart: null,
  editing: false,
  loading: false,

  fetchCharts: async (documentId) => {
    set({ loading: true });
    const { charts } = await api.get<{ charts: Chart[] }>(`/documents/${documentId}/charts`);
    set({ charts, loading: false });
  },

  createChart: async (documentId, data) => {
    const { chart } = await api.post<{ chart: Chart }>(`/documents/${documentId}/charts`, data);
    set((s) => ({ charts: [chart, ...s.charts], selectedChart: chart, editing: false }));
    return chart;
  },

  updateChart: async (documentId, chartId, data) => {
    const { chart } = await api.patch<{ chart: Chart }>(`/documents/${documentId}/charts/${chartId}`, data);
    set((s) => ({
      charts: s.charts.map((c) => (c.id === chartId ? chart : c)),
      selectedChart: s.selectedChart?.id === chartId ? chart : s.selectedChart,
      editing: false,
    }));
  },

  deleteChart: async (documentId, chartId) => {
    await api.delete(`/documents/${documentId}/charts/${chartId}`);
    set((s) => ({
      charts: s.charts.filter((c) => c.id !== chartId),
      selectedChart: s.selectedChart?.id === chartId ? null : s.selectedChart,
    }));
  },

  selectChart: (chart) => set({ selectedChart: chart, editing: false }),
  setEditing: (editing) => set({ editing }),
}));
