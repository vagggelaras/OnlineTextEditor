import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Bar, Line, Pie, Doughnut, Radar, PolarArea } from "react-chartjs-2"
import type { ChartType, ChartData } from "@/types/chart"

// Register all Chart.js components once
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface ChartPreviewProps {
  type: ChartType
  data: ChartData
  config?: Record<string, unknown>
  className?: string
}

const chartComponents = {
  bar: Bar,
  line: Line,
  pie: Pie,
  doughnut: Doughnut,
  radar: Radar,
  polarArea: PolarArea,
} as const

export function ChartPreview({ type, data, config, className }: ChartPreviewProps) {
  const Component = chartComponents[type]
  if (!Component) return null

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: "top" as const },
    },
    ...config,
  }

  return (
    <div className={className}>
      <Component data={data} options={options} />
    </div>
  )
}
