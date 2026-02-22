'use client';

import { Handle, Position, NodeProps } from '@xyflow/react';
import { Mail, Clock, GitBranch, Zap, Brain, MessageSquare } from 'lucide-react';

interface NodeData {
  label: string;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

const BASE_NODE = 'rounded-lg border-2 px-3 py-2 min-w-[140px] shadow-sm text-sm';

export function TriggerNode({ data, selected }: NodeProps) {
  const nodeData = data as NodeData;
  return (
    <div className={`${BASE_NODE} bg-green-50 border-green-400 ${selected ? 'ring-2 ring-green-500' : ''}`}>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-500" />
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-green-600 flex-shrink-0" />
        <div>
          <p className="text-xs text-green-600 font-medium">トリガー</p>
          <p className="font-semibold text-green-800">{nodeData.label}</p>
        </div>
      </div>
    </div>
  );
}

export function ActionNode({ data, selected }: NodeProps) {
  const nodeData = data as NodeData;
  return (
    <div className={`${BASE_NODE} bg-blue-50 border-blue-400 ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-blue-600 flex-shrink-0" />
        <div>
          <p className="text-xs text-blue-600 font-medium">アクション</p>
          <p className="font-semibold text-blue-800">{nodeData.label}</p>
        </div>
      </div>
    </div>
  );
}

export function ConditionNode({ data, selected }: NodeProps) {
  const nodeData = data as NodeData;
  return (
    <div className={`${BASE_NODE} bg-amber-50 border-amber-400 ${selected ? 'ring-2 ring-amber-500' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-amber-500" />
      <Handle type="source" position={Position.Bottom} id="yes" style={{ left: '25%' }} className="w-3 h-3 bg-green-500" />
      <Handle type="source" position={Position.Bottom} id="no" style={{ left: '75%' }} className="w-3 h-3 bg-red-500" />
      <div className="flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <div>
          <p className="text-xs text-amber-600 font-medium">条件分岐</p>
          <p className="font-semibold text-amber-800">{nodeData.label}</p>
        </div>
      </div>
    </div>
  );
}

export function DelayNode({ data, selected }: NodeProps) {
  const nodeData = data as NodeData;
  return (
    <div className={`${BASE_NODE} bg-purple-50 border-purple-400 ${selected ? 'ring-2 ring-purple-500' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-500" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-500" />
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-purple-600 flex-shrink-0" />
        <div>
          <p className="text-xs text-purple-600 font-medium">待機</p>
          <p className="font-semibold text-purple-800">{nodeData.label}</p>
        </div>
      </div>
    </div>
  );
}

export function AiDecisionNode({ data, selected }: NodeProps) {
  const nodeData = data as NodeData;
  return (
    <div className={`${BASE_NODE} bg-rose-50 border-rose-400 ${selected ? 'ring-2 ring-rose-500' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-rose-500" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-rose-500" />
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-rose-600 flex-shrink-0" />
        <div>
          <p className="text-xs text-rose-600 font-medium">AI判断</p>
          <p className="font-semibold text-rose-800">{nodeData.label}</p>
        </div>
      </div>
    </div>
  );
}

export const nodeTypes = {
  TRIGGER: TriggerNode,
  ACTION: ActionNode,
  CONDITION: ConditionNode,
  DELAY: DelayNode,
  AI_DECISION: AiDecisionNode,
};
