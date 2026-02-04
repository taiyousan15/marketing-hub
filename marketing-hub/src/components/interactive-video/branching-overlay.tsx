'use client';

import { type BranchOption } from '@/lib/interactive-video/state-machine';
import { Sparkles } from 'lucide-react';

interface BranchingOverlayProps {
  branches: BranchOption[];
  onSelect: (branchId: string) => void;
  aiRecommendation?: string;
}

export function BranchingOverlay({
  branches,
  onSelect,
  aiRecommendation,
}: BranchingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10 animate-in fade-in duration-300">
      <div className="max-w-2xl w-full px-6">
        <h2 className="text-3xl font-bold text-white text-center mb-2">
          あなたに合ったコースを選んでください
        </h2>
        <p className="text-gray-300 text-center mb-8">
          あなたのレベルに最適な内容をご提供します
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => {
            const isRecommended = aiRecommendation === branch.id;

            return (
              <button
                key={branch.id}
                onClick={() => onSelect(branch.id)}
                className={`
                  relative group p-6 rounded-xl border-2 transition-all duration-200
                  ${
                    isRecommended
                      ? 'border-yellow-400 bg-yellow-500/10 shadow-lg shadow-yellow-500/20'
                      : 'border-gray-600 bg-gray-800/50 hover:border-blue-500 hover:bg-blue-500/10'
                  }
                  hover:scale-105 hover:shadow-xl
                `}
              >
                {isRecommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-400 text-black text-xs font-bold rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    おすすめ
                  </div>
                )}

                <div className="flex flex-col items-center text-center space-y-3">
                  {branch.icon && (
                    <div className="text-4xl">{branch.icon}</div>
                  )}

                  <h3 className="text-xl font-semibold text-white">
                    {branch.label}
                  </h3>

                  {branch.description && (
                    <p className="text-sm text-gray-400">
                      {branch.description}
                    </p>
                  )}

                  <div
                    className={`
                    mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${
                      isRecommended
                        ? 'bg-yellow-400 text-black'
                        : 'bg-blue-600 text-white group-hover:bg-blue-500'
                    }
                  `}
                  >
                    このコースを選ぶ
                  </div>
                </div>

                {/* Glow effect for recommended */}
                {isRecommended && (
                  <div className="absolute inset-0 rounded-xl bg-yellow-400/5 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          選択しない場合、15秒後に自動的に中級者向けコースに進みます
        </p>
      </div>
    </div>
  );
}
