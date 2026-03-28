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
  ReactFlowProvider,
  type Connection,
  type Node,
  type Edge,
  type NodeTypes,
  type OnConnectStart,
  type OnConnectEnd,
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

type Tool = "select" | "draw" | "text"

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
  const [isDrawing, setIsDrawing] = useState(false)
  const currentPath = useRef<string[]>([])
  const svgRef = useRef<SVGSVGElement>(null)
  const { screenToFlowPosition } = useReactFlow()

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

  // --- Add nodes ---
  const addNode = useCallback(
    (type: "rectNode" | "circleNode" | "diamondNode" | "plainText") => {
      const id = `node_${++nodeId}`
      const defaults: Record<string, { label: string; fontSize?: number }> = {
        rectNode: { label: "New Node" },
        circleNode: { label: "State" },
        diamondNode: { label: "Condition" },
        plainText: { label: "Text", fontSize: 16 },
      }
      const newNode: Node = {
        id,
        type,
        position: { x: 250 + Math.random() * 200, y: 150 + Math.random() * 200 },
        data: {
          ...defaults[type],
          color: type === "plainText" ? "#1f2937" : "#d1d5db",
          onLabelChange: (label: string) => updateNodeLabel(id, label),
        },
      }
      setNodes((nds) => [...nds, newNode])
      setTool("select")
    },
    [setNodes, updateNodeLabel]
  )

  // --- Add text node on canvas click when text tool active ---
  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (tool !== "text") return
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      const id = `node_${++nodeId}`
      const newNode: Node = {
        id,
        type: "plainText",
        position,
        data: {
          label: "Text",
          color: drawColor,
          fontSize: 16,
          onLabelChange: (label: string) => updateNodeLabel(id, label),
        },
      }
      setNodes((nds) => [...nds, newNode])
      setTool("select")
    },
    [tool, screenToFlowPosition, setNodes, updateNodeLabel, drawColor]
  )

  // --- Free drawing ---
  const handleDrawStart = useCallback(
    (e: React.MouseEvent) => {
      if (tool !== "draw") return
      e.preventDefault()
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      currentPath.current = [`M ${pos.x} ${pos.y}`]
      setIsDrawing(true)
    },
    [tool, screenToFlowPosition]
  )

  const handleDrawMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing || tool !== "draw") return
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      currentPath.current.push(`L ${pos.x} ${pos.y}`)
      // Update SVG in real-time via ref for performance
      const svgPath = svgRef.current?.querySelector("#drawing-path") as SVGPathElement | null
      if (svgPath) {
        svgPath.setAttribute("d", currentPath.current.join(" "))
      }
    },
    [isDrawing, tool, screenToFlowPosition]
  )

  const handleDrawEnd = useCallback(() => {
    if (!isDrawing || tool !== "draw") return
    setIsDrawing(false)
    if (currentPath.current.length > 1) {
      setPaths((prev) => [
        ...prev,
        {
          id: `path_${++pathId}`,
          d: currentPath.current.join(" "),
          color: drawColor,
          width: drawWidth,
        },
      ])
    }
    currentPath.current = []
    // Clear the live drawing path
    const svgPath = svgRef.current?.querySelector("#drawing-path") as SVGPathElement | null
    if (svgPath) svgPath.setAttribute("d", "")
  }, [isDrawing, tool, drawColor, drawWidth])

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

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = () => { setShowColors(false); setShowStroke(false) }
    if (showColors || showStroke) {
      document.addEventListener("mousedown", handler)
      return () => document.removeEventListener("mousedown", handler)
    }
  }, [showColors, showStroke])

  const isDrawMode = tool === "draw"
  const isTextMode = tool === "text"

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes.map((n) => ({
          ...n,
          data: { ...n.data, onLabelChange: (label: string) => updateNodeLabel(n.id, label) },
        }))}
        edges={edges}
        onNodesChange={tool === "select" ? onNodesChange : undefined}
        onEdgesChange={tool === "select" ? onEdgesChange : undefined}
        onConnect={tool === "select" ? onConnect : undefined}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode={["Backspace", "Delete"]}
        panOnDrag={!isDrawMode}
        zoomOnScroll={!isDrawMode}
        nodesDraggable={tool === "select"}
        nodesConnectable={tool === "select"}
        elementsSelectable={tool === "select"}
        onPaneClick={handlePaneClick}
        className="bg-gray-50"
      >
        <Background gap={20} size={1} />
        <Controls />
        <MiniMap nodeStrokeWidth={3} className="!bg-white !border-gray-200" />

        {/* Drawing SVG overlay — rendered inside React Flow's viewport so it transforms with zoom/pan */}
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 4 }}
        >
          {paths.map((p) => (
            <path
              key={p.id}
              d={p.d}
              fill="none"
              stroke={p.color}
              strokeWidth={p.width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {/* Live drawing path */}
          <path
            id="drawing-path"
            fill="none"
            stroke={drawColor}
            strokeWidth={drawWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Transparent overlay to capture draw/text events */}
        {(isDrawMode || isTextMode) && (
          <div
            className={`absolute inset-0 ${isDrawMode ? "cursor-crosshair" : "cursor-text"}`}
            style={{ zIndex: 5 }}
            onMouseDown={isDrawMode ? handleDrawStart : undefined}
            onMouseMove={isDrawMode ? handleDrawMove : undefined}
            onMouseUp={isDrawMode ? handleDrawEnd : undefined}
            onMouseLeave={isDrawMode ? handleDrawEnd : undefined}
            onClick={isTextMode ? handlePaneClick : undefined}
          />
        )}

        {/* Toolbar */}
        <Panel position="top-left">
          <div className="flex items-center gap-1 bg-white rounded-lg shadow-md border border-gray-200 p-1.5">
            {/* Tool selection */}
            <Button
              variant={tool === "select" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTool("select")}
              className="h-8 w-8 p-0"
              title="Select (V)"
            >
              <MousePointer2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={tool === "draw" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTool("draw")}
              className="h-8 w-8 p-0"
              title="Draw (D)"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={tool === "text" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTool("text")}
              className="h-8 w-8 p-0"
              title="Text (T)"
            >
              <Type className="h-3.5 w-3.5" />
            </Button>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Shapes */}
            <Button variant="ghost" size="sm" onClick={() => addNode("rectNode")} className="h-8 gap-1.5 text-xs" title="Rectangle">
              <Square className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => addNode("circleNode")} className="h-8 gap-1.5 text-xs" title="Circle">
              <Circle className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => addNode("diamondNode")} className="h-8 gap-1.5 text-xs" title="Diamond">
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
        </Panel>

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
