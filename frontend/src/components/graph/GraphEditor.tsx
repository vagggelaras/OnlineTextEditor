import { useCallback, useRef, useState, useEffect } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useViewport,
  ReactFlowProvider,
  type Connection,
  type Node,
  type Edge,
  type NodeTypes,
  MarkerType,
  Position,
  Handle,
  type NodeProps,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Button } from "@/components/ui/button"
import {
  Square,
  Circle,
  Diamond,
  Trash2,
  Palette,
  Pencil,
  Type,
  MousePointer2,
  Minus,
} from "lucide-react"

// --- Custom Node Components ---

function RectNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`px-4 py-2 rounded-lg border-2 bg-white shadow-sm min-w-[120px] text-center transition-colors`}
      style={{ borderColor: selected ? "#3b82f6" : (data.color as string) || "#d1d5db" }}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-gray-400" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-gray-400" />
      <div
        contentEditable
        suppressContentEditableWarning
        className="outline-none text-sm font-medium min-w-[40px]"
        onBlur={(e) => {
          if (data.onLabelChange) (data.onLabelChange as (l: string) => void)(e.currentTarget.textContent || "")
        }}
      >
        {data.label as string}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-gray-400" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-gray-400" />
    </div>
  )
}

function CircleNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`w-[100px] h-[100px] rounded-full border-2 bg-white shadow-sm flex items-center justify-center transition-colors`}
      style={{ borderColor: selected ? "#3b82f6" : (data.color as string) || "#d1d5db" }}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-gray-400" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-gray-400" />
      <div
        contentEditable
        suppressContentEditableWarning
        className="outline-none text-xs font-medium text-center max-w-[70px]"
        onBlur={(e) => {
          if (data.onLabelChange) (data.onLabelChange as (l: string) => void)(e.currentTarget.textContent || "")
        }}
      >
        {data.label as string}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-gray-400" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-gray-400" />
    </div>
  )
}

function DiamondNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`w-[100px] h-[100px] border-2 bg-white shadow-sm flex items-center justify-center transition-colors`}
      style={{
        transform: "rotate(45deg)",
        borderColor: selected ? "#3b82f6" : (data.color as string) || "#d1d5db",
      }}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-gray-400" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-gray-400" />
      <div
        contentEditable
        suppressContentEditableWarning
        className="outline-none text-xs font-medium text-center max-w-[60px]"
        style={{ transform: "rotate(-45deg)" }}
        onBlur={(e) => {
          if (data.onLabelChange) (data.onLabelChange as (l: string) => void)(e.currentTarget.textContent || "")
        }}
      >
        {data.label as string}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-gray-400" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-gray-400" />
    </div>
  )
}

function PlainTextNode({ data, selected }: NodeProps) {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-gray-400 !opacity-0 hover:!opacity-100" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-gray-400 !opacity-0 hover:!opacity-100" />
      <div
        contentEditable
        suppressContentEditableWarning
        className={`outline-none min-w-[60px] px-2 py-1 rounded ${selected ? "ring-2 ring-blue-400" : ""}`}
        style={{
          fontSize: `${(data.fontSize as number) || 16}px`,
          color: (data.color as string) || "#1f2937",
          fontWeight: (data.bold as boolean) ? "bold" : "normal",
        }}
        onBlur={(e) => {
          if (data.onLabelChange) (data.onLabelChange as (l: string) => void)(e.currentTarget.textContent || "")
        }}
      >
        {data.label as string}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-gray-400 !opacity-0 hover:!opacity-100" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-gray-400 !opacity-0 hover:!opacity-100" />
    </div>
  )
}

const nodeTypes: NodeTypes = {
  rectNode: RectNode,
  circleNode: CircleNode,
  diamondNode: DiamondNode,
  plainText: PlainTextNode,
}

const COLORS = ["#1f2937", "#d1d5db", "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"]
const STROKE_WIDTHS = [2, 4, 6, 8]

type Tool = "select" | "draw" | "text" | "rect" | "circle" | "diamond"

interface DrawPath {
  id: string
  d: string
  color: string
  width: number
}

let nodeId = 0
let pathId = 0

interface GraphEditorProps {
  documentId: string
}

function GraphEditorInner({ documentId }: GraphEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [tool, setTool] = useState<Tool>("select")
  const [drawColor, setDrawColor] = useState("#1f2937")
  const [drawWidth, setDrawWidth] = useState(3)
  const [showColors, setShowColors] = useState(false)
  const [showStroke, setShowStroke] = useState(false)
  const [paths, setPaths] = useState<DrawPath[]>([])
  const isDrawingRef = useRef(false)
  const currentPath = useRef<string[]>([])
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const drawColorRef = useRef(drawColor)
  const drawWidthRef = useRef(drawWidth)
  drawColorRef.current = drawColor
  drawWidthRef.current = drawWidth
  const { screenToFlowPosition } = useReactFlow()
  const { x: vpX, y: vpY, zoom: vpZoom } = useViewport()

  // --- Connections ---
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
            style: { strokeWidth: 2 },
          },
          eds
        )
      )
    },
    [setEdges]
  )

  // --- Node label editing ---
  const updateNodeLabel = useCallback(
    (id: string, label: string) => {
      setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n)))
    },
    [setNodes]
  )

  // --- Place node on canvas click (for shape/text tools) ---
  const placementTools: Record<string, { nodeType: string; label: string; fontSize?: number }> = {
    rect: { nodeType: "rectNode", label: "New Node" },
    circle: { nodeType: "circleNode", label: "State" },
    diamond: { nodeType: "diamondNode", label: "Condition" },
    text: { nodeType: "plainText", label: "Text", fontSize: 16 },
  }

  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      const placement = placementTools[tool]
      if (!placement) return
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      const id = `node_${++nodeId}`
      const newNode: Node = {
        id,
        type: placement.nodeType,
        position,
        data: {
          label: placement.label,
          fontSize: placement.fontSize,
          color: placement.nodeType === "plainText" ? drawColor : "#d1d5db",
          onLabelChange: (label: string) => updateNodeLabel(id, label),
        },
      }
      setNodes((nds) => [...nds, newNode])
      setTool("select")
    },
    [tool, screenToFlowPosition, setNodes, updateNodeLabel, drawColor]
  )

  // --- Free drawing via native capture-phase listeners ---
  // Left-click draws, middle-click passes through to ReactFlow for panning
  useEffect(() => {
    if (tool !== "draw") return
    const container = containerRef.current
    if (!container) return

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return // only left-click draws; middle-click goes to ReactFlow
      if (toolbarRef.current?.contains(e.target as HTMLElement)) return // don't draw on toolbar
      e.stopPropagation()
      e.preventDefault()
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      currentPath.current = [`M ${pos.x} ${pos.y}`]
      isDrawingRef.current = true
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isDrawingRef.current) return
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      currentPath.current.push(`L ${pos.x} ${pos.y}`)
      const svgPath = svgRef.current?.querySelector("#drawing-path") as SVGPathElement | null
      if (svgPath) svgPath.setAttribute("d", currentPath.current.join(" "))
    }

    const onMouseUp = () => {
      if (!isDrawingRef.current) return
      isDrawingRef.current = false
      if (currentPath.current.length > 1) {
        setPaths((prev) => [
          ...prev,
          {
            id: `path_${++pathId}`,
            d: currentPath.current.join(" "),
            color: drawColorRef.current,
            width: drawWidthRef.current,
          },
        ])
      }
      currentPath.current = []
      const svgPath = svgRef.current?.querySelector("#drawing-path") as SVGPathElement | null
      if (svgPath) svgPath.setAttribute("d", "")
    }

    container.addEventListener("mousedown", onMouseDown, true) // capture phase
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)

    return () => {
      container.removeEventListener("mousedown", onMouseDown, true)
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [tool, screenToFlowPosition])

  // --- Delete ---
  const deleteSelected = useCallback(() => {
    const selectedNodeIds = new Set(nodes.filter((n) => n.selected).map((n) => n.id))
    setNodes((nds) => nds.filter((n) => !n.selected))
    setEdges((eds) => {
      const selectedEdgeIds = new Set(edges.filter((e) => e.selected).map((e) => e.id))
      return eds.filter(
        (e) => !selectedEdgeIds.has(e.id) && !selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target)
      )
    })
  }, [setNodes, setEdges, nodes, edges])

  const clearDrawing = useCallback(() => {
    setPaths([])
  }, [])

  const changeSelectedColor = useCallback(
    (color: string) => {
      setNodes((nds) => nds.map((n) => (n.selected ? { ...n, data: { ...n.data, color } } : n)))
      setDrawColor(color)
      setShowColors(false)
    },
    [setNodes]
  )

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in an input or contentEditable
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return
      switch (e.key) {
        case "1": setTool("select"); break
        case "2": setTool("draw"); break
        case "3": setTool("text"); break
        case "4": setTool("rect"); break
        case "5": setTool("circle"); break
        case "6": setTool("diamond"); break
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = () => { setShowColors(false); setShowStroke(false) }
    if (showColors || showStroke) {
      document.addEventListener("mousedown", handler)
      return () => document.removeEventListener("mousedown", handler)
    }
  }, [showColors, showStroke])

  const isDrawMode = tool === "draw"
  const isPlacementMode = tool === "text" || tool === "rect" || tool === "circle" || tool === "diamond"

  return (
    <div
      ref={containerRef}
      className={`h-full w-full relative ${isDrawMode ? "cursor-crosshair" : isPlacementMode ? "cursor-crosshair" : ""}`}
    >
      <ReactFlow
        nodes={nodes.map((n) => ({
          ...n,
          data: { ...n.data, onLabelChange: (label: string) => updateNodeLabel(n.id, label) },
        }))}
        edges={edges}
        onNodesChange={!isDrawMode && !isPlacementMode ? onNodesChange : undefined}
        onEdgesChange={!isDrawMode && !isPlacementMode ? onEdgesChange : undefined}
        onConnect={!isDrawMode && !isPlacementMode ? onConnect : undefined}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode={["Backspace", "Delete"]}
        panOnDrag={isDrawMode || isPlacementMode ? [1] : [0, 1]}
        zoomOnScroll
        nodesDraggable={tool === "select"}
        nodesConnectable={tool === "select"}
        elementsSelectable={tool === "select"}
        onPaneClick={handlePaneClick}
        className="bg-gray-50"
      >
        <Background gap={20} size={1} />
        <Controls />
        <MiniMap nodeStrokeWidth={3} className="!bg-white !border-gray-200" />

        {/* Instructions */}
        {nodes.length === 0 && paths.length === 0 && (
          <Panel position="top-center">
            <div className="bg-white/90 backdrop-blur rounded-lg shadow-sm border border-gray-200 px-6 py-4 text-center mt-16">
              <p className="text-sm font-medium mb-1">Start building your graph</p>
              <p className="text-xs text-muted-foreground">
                Add shapes, draw freely, or click to place text. Drag between handles to connect nodes.
              </p>
            </div>
          </Panel>
        )}
      </ReactFlow>

      {/* Drawing SVG overlay — outside ReactFlow, uses viewport transform to stay in sync */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        style={{ zIndex: 10 }}
      >
        <g transform={`translate(${vpX}, ${vpY}) scale(${vpZoom})`}>
          {paths.map((p) => (
            <path
              key={p.id}
              d={p.d}
              fill="none"
              stroke={p.color}
              strokeWidth={p.width / vpZoom}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {/* Live drawing path */}
          <path
            id="drawing-path"
            fill="none"
            stroke={drawColor}
            strokeWidth={drawWidth / vpZoom}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>

      {/* Toolbar */}
      <div ref={toolbarRef} className="absolute top-2 left-2" style={{ zIndex: 20 }}>
        <div className="flex items-center gap-1 bg-white rounded-lg shadow-md border border-gray-200 p-1.5">
          {/* Tool selection */}
          <Button
            variant={tool === "select" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setTool("select")}
            className="h-8 w-8 p-0"
            title="Select (1)"
          >
            <MousePointer2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={tool === "draw" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setTool("draw")}
            className="h-8 w-8 p-0"
            title="Draw (2)"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={tool === "text" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setTool("text")}
            className="h-8 w-8 p-0"
            title="Text (3)"
          >
            <Type className="h-3.5 w-3.5" />
          </Button>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Shapes — click canvas to place */}
          <Button
            variant={tool === "rect" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setTool("rect")}
            className="h-8 gap-1.5 text-xs"
            title="Rectangle (4)"
          >
            <Square className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={tool === "circle" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setTool("circle")}
            className="h-8 gap-1.5 text-xs"
            title="Circle (5)"
          >
            <Circle className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={tool === "diamond" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setTool("diamond")}
            className="h-8 gap-1.5 text-xs"
            title="Diamond (6)"
          >
            <Diamond className="h-3.5 w-3.5" />
          </Button>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Color picker */}
          <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setShowColors(!showColors); setShowStroke(false) }}
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent"
              title="Color"
            >
              <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: drawColor }} />
            </button>
            {showColors && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50">
                <div className="grid grid-cols-3 gap-1.5">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      className={`w-7 h-7 rounded-full border-2 hover:scale-110 transition-transform ${
                        drawColor === color ? "border-blue-500" : "border-white"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => changeSelectedColor(color)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stroke width (for drawing) */}
          <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowStroke(!showStroke); setShowColors(false) }}
              className="h-8 w-8 p-0"
              title="Stroke width"
            >
              <Minus className="h-3.5 w-3.5" strokeWidth={drawWidth} />
            </Button>
            {showStroke && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50">
                <div className="flex flex-col gap-1">
                  {STROKE_WIDTHS.map((w) => (
                    <button
                      key={w}
                      className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 ${
                        drawWidth === w ? "bg-gray-100" : ""
                      }`}
                      onClick={() => { setDrawWidth(w); setShowStroke(false) }}
                    >
                      <div className="w-8 rounded-full bg-gray-800" style={{ height: `${w}px` }} />
                      <span className="text-xs text-muted-foreground">{w}px</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Delete + Clear drawing */}
          <Button
            variant="ghost"
            size="sm"
            onClick={deleteSelected}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            title="Delete selected"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          {paths.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDrawing}
              className="h-8 text-xs text-muted-foreground"
              title="Clear all drawings"
            >
              Clear drawing
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function GraphEditor({ documentId }: GraphEditorProps) {
  return (
    <ReactFlowProvider>
      <GraphEditorInner documentId={documentId} />
    </ReactFlowProvider>
  )
}
