'use client';

import { SmartVSLPlayer } from '@/components/interactive-video/smart-vsl-player';
import { defaultVideoConfig } from '@/lib/interactive-video/state-machine';

export default function InteractiveVideoDemo() {
  const handleStateChange = (state: string) => {
    console.log('State changed to:', state);
  };

  const handleTrackingEvent = (event: {
    type: string;
    timestamp: number;
    data: unknown;
  }) => {
    console.log('Tracking event:', event);

    // Send to API
    fetch('/api/interactive-video/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }).catch((error) => {
      console.error('Failed to send tracking event:', error);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Interactive Video System Demo
          </h1>
          <p className="text-xl text-gray-300">
            XState駆動のインタラクティブ動画プレイヤー
          </p>
        </div>

        <SmartVSLPlayer
          config={defaultVideoConfig}
          autoPlay={false}
          onStateChange={handleStateChange}
          onTrackingEvent={handleTrackingEvent}
        />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">
              状態管理
            </h3>
            <p className="text-sm text-gray-400">
              XStateによる予測可能な状態遷移とビジネスロジックの分離
            </p>
          </div>

          <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">
              分岐ロジック
            </h3>
            <p className="text-sm text-gray-400">
              視聴者の選択に基づく動的な動画分岐とAI推奨
            </p>
          </div>

          <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">
              行動追跡
            </h3>
            <p className="text-sm text-gray-400">
              視聴時間、クリック、選択を完全追跡してコンバージョン最適化
            </p>
          </div>
        </div>

        <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">
            機能一覧
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>✅ 動画内分岐選択（最大4分岐）</li>
            <li>✅ クリッカブルホットスポット</li>
            <li>✅ 動的CTAボタン表示</li>
            <li>✅ 自動タイムアウト機能</li>
            <li>✅ AI推奨アルゴリズム</li>
            <li>✅ リアルタイム視聴追跡</li>
            <li>✅ レスポンシブデザイン</li>
            <li>✅ アクセシビリティ対応</li>
          </ul>
        </div>

        <div className="mt-8 p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-400 mb-3">
            使い方
          </h3>
          <ol className="space-y-2 text-sm text-gray-300 list-decimal list-inside">
            <li>「動画を開始」ボタンをクリック</li>
            <li>動画視聴中にホットスポットをクリック（スキップ可能）</li>
            <li>分岐選択画面でレベルを選択</li>
            <li>対応するソリューション動画を視聴</li>
            <li>CTAボタンからチェックアウトへ</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
