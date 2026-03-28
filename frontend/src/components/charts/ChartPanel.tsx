import { useEffect } from "react"
import { useChartStore } from "@/stores/chartStore"
import { ChartPreview } from "./ChartPreview"
import { ChartEditor } from "./ChartEditor"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, X, BarChart3 } from "lucide-react"
import { toast } from "@/stores/toastStore"
import { confirmDialog } from "@/stores/confirmStore"

interface ChartPanelProps {
  documentId: string
  onClose: () => void
}

export function ChartPanel({ documentId, onClose }: ChartPanelProps) {
  const { charts, selectedChart, editing, loading, fetchCharts, deleteChart, selectChart, setEditing } =
    useChartStore()

  useEffect(() => {
    fetchCharts(documentId)
  }, [documentId, fetchCharts])

  // Editing mode: show ChartEditor
  if (editing) {
    return (
      <div className="h-full flex flex-col bg-background border-l border-border">
        <ChartEditor documentId={documentId} chart={selectedChart} />
      </div>
    )
  }

  // Viewing a selected chart
  if (selectedChart) {
    return (
      <div className="h-full flex flex-col bg-background border-l border-border">
        <div className="flex items-center gap-2 p-3 border-b border-border">
          <Button variant="ghost" size="sm" onClick={() => selectChart(null)} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold flex-1 truncate">
            {selectedChart.type.charAt(0).toUpperCase() + selectedChart.type.slice(1)} Chart
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              const ok = await confirmDialog({ title: "Delete chart", description: "This chart will be permanently deleted." })
              if (!ok) return
              await deleteChart(documentId, selectedChart.id)
              toast({ title: "Chart deleted", variant: "success" })
            }}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <ChartPreview
            type={selectedChart.type}
            data={selectedChart.data}
            config={selectedChart.config}
          />
        </div>
      </div>
    )
  }

  // Chart list
  return (
    <div className="h-full flex flex-col bg-background border-l border-border">
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold flex-1">Charts</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            selectChart(null)
            setEditing(true)
          }}
          className="h-8 w-8 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-8">Loading...</p>
        ) : charts.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground font-medium">No charts yet</p>
            <p className="text-xs text-muted-foreground/60 max-w-[200px] mx-auto">
              Visualize your data with bar, line, pie, and more chart types.
            </p>
            <Button
              size="sm"
              onClick={() => {
                selectChart(null)
                setEditing(true)
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Create Chart
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {charts.map((chart) => (
              <button
                key={chart.id}
                onClick={() => selectChart(chart)}
                className="w-full text-left rounded-md border border-border p-2 hover:bg-accent transition-colors"
              >
                <div className="text-xs font-medium mb-1">
                  {chart.type.charAt(0).toUpperCase() + chart.type.slice(1)} Chart
                </div>
                <div className="h-[120px]">
                  <ChartPreview type={chart.type} data={chart.data} config={chart.config} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
