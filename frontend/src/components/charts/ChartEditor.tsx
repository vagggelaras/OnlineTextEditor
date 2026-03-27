import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChartPreview } from "./ChartPreview"
import { useChartStore } from "@/stores/chartStore"
import type { Chart, ChartType, ChartData, ChartDataset } from "@/types/chart"
import { Plus, Trash2, ArrowLeft } from "lucide-react"

interface ChartEditorProps {
  documentId: string
  chart?: Chart | null
}

const chartTypes: { value: ChartType; label: string }[] = [
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "pie", label: "Pie" },
  { value: "doughnut", label: "Doughnut" },
  { value: "radar", label: "Radar" },
  { value: "polarArea", label: "Polar Area" },
]

const defaultColors = [
  "rgba(99, 132, 255, 0.6)",
  "rgba(255, 99, 132, 0.6)",
  "rgba(75, 192, 192, 0.6)",
  "rgba(255, 205, 86, 0.6)",
  "rgba(153, 102, 255, 0.6)",
  "rgba(255, 159, 64, 0.6)",
  "rgba(54, 162, 235, 0.6)",
  "rgba(201, 203, 207, 0.6)",
]

const defaultBorderColors = [
  "rgba(99, 132, 255, 1)",
  "rgba(255, 99, 132, 1)",
  "rgba(75, 192, 192, 1)",
  "rgba(255, 205, 86, 1)",
  "rgba(153, 102, 255, 1)",
  "rgba(255, 159, 64, 1)",
  "rgba(54, 162, 235, 1)",
  "rgba(201, 203, 207, 1)",
]

function createEmptyDataset(index: number): ChartDataset {
  return {
    label: `Dataset ${index + 1}`,
    data: [],
    backgroundColor: defaultColors[index % defaultColors.length],
    borderColor: defaultBorderColors[index % defaultBorderColors.length],
    borderWidth: 1,
  }
}

export function ChartEditor({ documentId, chart }: ChartEditorProps) {
  const { createChart, updateChart, setEditing, selectChart } = useChartStore()
  const isNew = !chart

  const [type, setType] = useState<ChartType>(chart?.type || "bar")
  const [labels, setLabels] = useState<string[]>(chart?.data.labels || ["Label 1", "Label 2", "Label 3"])
  const [datasets, setDatasets] = useState<ChartDataset[]>(
    chart?.data.datasets || [createEmptyDataset(0)]
  )
  const [saving, setSaving] = useState(false)

  // Sync dataset data length with labels
  useEffect(() => {
    setDatasets((prev) =>
      prev.map((ds) => {
        const newData = [...ds.data]
        while (newData.length < labels.length) newData.push(0)
        if (newData.length > labels.length) newData.length = labels.length
        return { ...ds, data: newData }
      })
    )
  }, [labels.length])

  // For pie/doughnut/polarArea, use array of colors per data point
  const isPieType = type === "pie" || type === "doughnut" || type === "polarArea"

  const previewData: ChartData = {
    labels,
    datasets: datasets.map((ds, di) => ({
      ...ds,
      backgroundColor: isPieType
        ? labels.map((_, i) => defaultColors[(di + i) % defaultColors.length])
        : ds.backgroundColor,
      borderColor: isPieType
        ? labels.map((_, i) => defaultBorderColors[(di + i) % defaultBorderColors.length])
        : ds.borderColor,
    })),
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (isNew) {
        await createChart(documentId, { type, config: {}, data: previewData })
      } else {
        await updateChart(documentId, chart.id, { type, config: {}, data: previewData })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    if (isNew) {
      setEditing(false)
    } else {
      selectChart(chart)
    }
  }

  const addLabel = () => setLabels([...labels, `Label ${labels.length + 1}`])
  const removeLabel = (i: number) => {
    if (labels.length <= 1) return
    setLabels(labels.filter((_, idx) => idx !== i))
  }

  const addDataset = () => setDatasets([...datasets, createEmptyDataset(datasets.length)])
  const removeDataset = (i: number) => {
    if (datasets.length <= 1) return
    setDatasets(datasets.filter((_, idx) => idx !== i))
  }

  const updateDatasetLabel = (di: number, label: string) => {
    setDatasets(datasets.map((ds, i) => (i === di ? { ...ds, label } : ds)))
  }

  const updateDataValue = (di: number, li: number, value: number) => {
    setDatasets(
      datasets.map((ds, i) =>
        i === di
          ? { ...ds, data: ds.data.map((v, j) => (j === li ? value : v)) }
          : ds
      )
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <Button variant="ghost" size="sm" onClick={handleBack} className="h-8 w-8 p-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold text-sm flex-1">
          {isNew ? "New Chart" : "Edit Chart"}
        </h3>
        <Button size="sm" onClick={handleSave} disabled={saving} className="h-8">
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Preview */}
        <div className="bg-white rounded-md border border-border p-3">
          <ChartPreview type={type} data={previewData} className="max-h-[250px]" />
        </div>

        {/* Chart type */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Chart Type</label>
          <div className="grid grid-cols-3 gap-1">
            {chartTypes.map((ct) => (
              <button
                key={ct.value}
                onClick={() => setType(ct.value)}
                className={`text-xs py-1.5 px-2 rounded-md border transition-colors ${
                  type === ct.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-accent"
                }`}
              >
                {ct.label}
              </button>
            ))}
          </div>
        </div>

        {/* Labels */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-muted-foreground">Labels</label>
            <Button variant="ghost" size="sm" onClick={addLabel} className="h-6 text-xs px-2">
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
          <div className="space-y-1">
            {labels.map((label, i) => (
              <div key={i} className="flex items-center gap-1">
                <Input
                  value={label}
                  onChange={(e) => {
                    const newLabels = [...labels]
                    newLabels[i] = e.target.value
                    setLabels(newLabels)
                  }}
                  className="h-7 text-xs"
                />
                {labels.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLabel(i)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Datasets */}
        {datasets.map((ds, di) => (
          <div key={di} className="border border-border rounded-md p-2 space-y-2">
            <div className="flex items-center gap-1">
              <Input
                value={ds.label}
                onChange={(e) => updateDatasetLabel(di, e.target.value)}
                className="h-7 text-xs font-medium"
                placeholder="Dataset name"
              />
              {datasets.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDataset(di)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1">
              {labels.map((label, li) => (
                <div key={li} className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground truncate w-16">{label}</span>
                  <Input
                    type="number"
                    value={ds.data[li] ?? 0}
                    onChange={(e) => updateDataValue(di, li, parseFloat(e.target.value) || 0)}
                    className="h-7 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={addDataset} className="w-full h-8 text-xs">
          <Plus className="h-3 w-3 mr-1" /> Add Dataset
        </Button>
      </div>
    </div>
  )
}
