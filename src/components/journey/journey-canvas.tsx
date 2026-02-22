'use client';

import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  MarkerType,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Save, Plus, Loader2, Zap, Mail, GitBranch, Clock, Brain } from 'lucide-react';
import { nodeTypes } from './journey-node-types';
import { NodeConfigPanel } from './node-config-panel';
import { updateJourneyNodes } from '@/actions/journey';
import { JourneyNodeType } from '@prisma/client';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

interface JourneyNode {
  id: string;
  type: JourneyNodeType;
  label: string;
  positionX: number;
  positionY: number;
  config: Record<string, unknown>;
}

interface JourneyEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string | null;
}

interface JourneyCanvasProps {
  journeyId: string;
  initialNodes: JourneyNode[];
  initialEdges: JourneyEdge[];
}

function toFlowNode(node: JourneyNode): Node {
  return {
    id: node.id,
    type: node.type,
    position: { x: node.positionX, y: node.positionY },
    data: { label: node.label, config: node.config },
  };
}

function toFlowEdge(edge: JourneyEdge): Edge {
  return {
    id: edge.id,
    source: edge.sourceId,
    target: edge.targetId,
    label: edge.label ?? undefined,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { strokeWidth: 2 },
  };
}

const NODE_TYPE_LABELS: Record<JourneyNodeType, string> = {
  TRIGGER: 'トリガー',
  ACTION: 'アクション',
  CONDITION: '条件分岐',
  DELAY: '待機',
  AI_DECISION: 'AI判断',
};

const NODE_TYPE_ICONS: Record<JourneyNodeType, typeof Zap> = {
  TRIGGER: Zap,
  ACTION: Mail,
  CONDITION: GitBranch,
  DELAY: Clock,
  AI_DECISION: Brain,
};

export function JourneyCanvas({ journeyId, initialNodes, initialEdges }: JourneyCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes.map(toFlowNode));
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges.map(toFlowEdge));
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [saving, setSaving] = useState(false);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            id: nanoid(),
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { strokeWidth: 2 },
          },
          eds
        )
      ),
    [setEdges]
  );

  const handleAddNode = useCallback(
    (type: JourneyNodeType) => {
      const id = nanoid();
      const newNode: Node = {
        id,
        type,
        position: { x: 250 + Math.random() * 100, y: 100 + nodes.length * 100 },
        data: { label: NODE_TYPE_LABELS[type], config: {} },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [nodes.length, setNodes]
  );

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleNodeUpdate = useCallback(
    (nodeId: string, data: Partial<{ label: string; config: Record<string, unknown> }>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
        )
      );
      setSelectedNode((prev) =>
        prev?.id === nodeId ? { ...prev, data: { ...prev.data, ...data } } : prev
      );
    },
    [setNodes]
  );

  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNode(null);
    },
    [setNodes, setEdges]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const nodeData = nodes.map((n) => ({
        id: n.id,
        type: n.type as JourneyNodeType,
        label: (n.data.label as string) ?? '',
        positionX: n.position.x,
        positionY: n.position.y,
        config: (n.data.config as Record<string, unknown>) ?? {},
      }));

      const edgeData = edges.map((e) => ({
        id: e.id,
        sourceId: e.source,
        targetId: e.target,
        label: typeof e.label === 'string' ? e.label : null,
      }));

      await updateJourneyNodes(journeyId, nodeData, edgeData);
      toast.success('ジャーニーを保存しました');
    } catch (error) {
      toast.error('保存に失敗しました');
      console.error('Failed to save journey:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode="Delete"
        >
          <Background gap={16} />
          <Controls />
          <MiniMap />
          <Panel position="top-left" className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="secondary">
                  <Plus className="h-4 w-4 mr-1" />
                  ノード追加
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {(Object.keys(NODE_TYPE_LABELS) as JourneyNodeType[]).map((type) => {
                  const Icon = NODE_TYPE_ICONS[type];
                  return (
                    <DropdownMenuItem
                      key={type}
                      onClick={() => handleAddNode(type)}
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {NODE_TYPE_LABELS[type]}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              保存
            </Button>
          </Panel>
        </ReactFlow>
      </div>

      {selectedNode && (
        <NodeConfigPanel
          node={selectedNode as Node<{ label: string; config?: Record<string, unknown> }>}
          onUpdate={handleNodeUpdate}
          onDelete={handleNodeDelete}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
