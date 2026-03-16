/**
 * LP セクション画像生成スクリプト（Playwright版）
 * HTMLをレンダリングして高品質なLP画像を生成します
 *
 * Usage: node scripts/generate-lp-section-images.mjs
 */

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(process.env.HOME, 'Desktop/マーケティングハブLP保存/images');

// LP コンテンツ定義
const LP_SECTIONS = [
  {
    id: 'lp1-hero',
    filename: 'lp1-hero-cyberpunk.png',
    width: 1200,
    height: 630,
    html: createHeroSection({
      badge: '🔥 2026年最注目セミナー',
      headline: 'AIゴールドラッシュ\n第二次AIバブルで\n億を稼ぐ者が続出',
      subheadline: 'ChatGPT・Gemini・Claude…AI副業で月収100万円達成者が続出中',
      cta: '今すぐ無料で参加する →',
      theme: 'cyberpunk-dark',
    }),
  },
  {
    id: 'lp1-benefits',
    filename: 'lp1-benefits.png',
    width: 1200,
    height: 700,
    html: createBenefitsSection({
      title: 'このセミナーで得られること',
      benefits: [
        { icon: '🤖', title: 'AI副業の始め方', desc: '初心者でも月5万〜30万円を稼ぐ具体的な方法を公開' },
        { icon: '💰', title: '億超え事例の全貌', desc: '実際にAIで億を稼いだ方の成功戦略を詳細解説' },
        { icon: '⚡', title: '最新AIツール活用法', desc: 'ChatGPT・Gemini・Claude を使った収益化テクニック' },
        { icon: '📊', title: 'AIゴールドラッシュ市場分析', desc: '第二次AIバブルが来る前に仕掛ける投資・副業戦略' },
        { icon: '🎯', title: '今すぐ実践できるロードマップ', desc: '明日から始められる具体的な行動計画を提供' },
        { icon: '🏆', title: '特別特典プレゼント', desc: 'AI副業で使える厳選プロンプト集（非売品）を無料配布' },
      ],
      theme: 'red-dramatic',
    }),
  },
  {
    id: 'lp1-stats',
    filename: 'lp1-stats.png',
    width: 1200,
    height: 500,
    html: createStatsSection({
      headline: '実績・信頼の数字',
      stats: [
        { value: '0.5%', label: '日本人のみが知るAI副業の真実', sub: '情報格差が収入格差を生む時代' },
        { value: '10,000+', label: 'セミナー参加者数', sub: '口コミで広がる圧倒的な人気' },
        { value: '月収100万', label: '達成者続出', sub: '最短3ヶ月で達成した方も' },
        { value: '無料', label: '参加費用', sub: '今だけ限定公開中' },
      ],
      theme: 'office-pro',
    }),
  },
  {
    id: 'lp1-cta-button',
    filename: 'lp1-cta-button.png',
    width: 600,
    height: 100,
    html: createCTAButton({
      text: '今すぐ無料で参加登録する →',
      sub: '残り87席 · 参加費無料 · 今すぐ申込可能',
    }),
  },
  {
    id: 'lp1-magazine-cover',
    filename: 'lp1-magazine-cover.png',
    width: 1200,
    height: 700,
    html: createMagazineCover({
      title: 'AIゴールドラッシュ\n完全攻略バイブル',
      subtitle: '第二次AIバブル到来\n今すぐ行動しないと\n一生後悔する理由',
      badge: '2026年版 最新完全版',
      price: '¥9,800相当 → 今だけ無料',
    }),
  },
];

// --- HTML テンプレート関数 ---

function createHeroSection({ badge, headline, subheadline, cta }) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    background: linear-gradient(135deg, #050d1a 0%, #0a1628 40%, #0d1f3c 70%, #071224 100%);
    font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
    position: relative;
  }
  /* 背景グリッド */
  .grid-bg {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(0,150,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,150,255,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  /* グロー効果 */
  .glow-circle {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
  }
  .glow-1 { width: 600px; height: 600px; background: rgba(0,80,255,0.12); top: -200px; left: -100px; }
  .glow-2 { width: 400px; height: 400px; background: rgba(100,0,255,0.1); bottom: -100px; right: 100px; }
  .glow-3 { width: 300px; height: 300px; background: rgba(0,200,255,0.08); top: 50px; right: 300px; }

  /* スキャンライン */
  .scanlines {
    position: absolute; inset: 0;
    background: repeating-linear-gradient(
      0deg, transparent, transparent 2px,
      rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px
    );
    pointer-events: none;
  }

  .content {
    position: relative; z-index: 10;
    padding: 50px 60px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    max-width: 720px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(90deg, rgba(255,60,0,0.9), rgba(255,120,0,0.9));
    border-radius: 50px;
    padding: 6px 18px;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 24px;
    width: fit-content;
    box-shadow: 0 0 20px rgba(255,80,0,0.4);
  }

  .headline {
    font-size: 56px;
    font-weight: 900;
    line-height: 1.15;
    white-space: pre-line;
    margin-bottom: 20px;
    background: linear-gradient(180deg, #ffffff 0%, #a0c8ff 60%, #5090ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: none;
    filter: drop-shadow(0 0 30px rgba(80,144,255,0.5));
  }

  .subheadline {
    font-size: 18px;
    color: rgba(160,200,255,0.85);
    line-height: 1.6;
    margin-bottom: 36px;
    font-weight: 400;
  }

  .cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: linear-gradient(90deg, #ff6b00, #ff9500);
    border-radius: 8px;
    padding: 16px 36px;
    font-size: 20px;
    font-weight: 800;
    color: #fff;
    width: fit-content;
    box-shadow: 0 8px 32px rgba(255,100,0,0.45), 0 0 0 1px rgba(255,150,0,0.3);
    letter-spacing: 0.02em;
  }

  /* 右側のデコレーション */
  .deco-right {
    position: absolute;
    right: 0; top: 0; bottom: 0;
    width: 480px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ai-orb {
    width: 320px; height: 320px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, rgba(100,180,255,0.3), rgba(20,60,180,0.2), transparent 70%);
    border: 1px solid rgba(80,150,255,0.3);
    box-shadow:
      0 0 60px rgba(60,120,255,0.25),
      inset 0 0 60px rgba(40,100,255,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .ai-text {
    font-size: 100px;
    font-weight: 900;
    background: linear-gradient(135deg, #c8a020, #ffd700, #fff8a0, #ffd700, #b8860b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 20px rgba(255,215,0,0.6)) drop-shadow(0 4px 8px rgba(0,0,0,0.5));
    letter-spacing: -5px;
  }

  /* 浮遊する粒子 */
  .particle {
    position: absolute;
    border-radius: 50%;
    background: rgba(100,180,255,0.6);
    animation: none;
  }

  /* ボーダーライン */
  .border-line {
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, transparent, #5090ff, #00ccff, #5090ff, transparent);
  }
</style>
</head>
<body>
  <div class="grid-bg"></div>
  <div class="glow-circle glow-1"></div>
  <div class="glow-circle glow-2"></div>
  <div class="glow-circle glow-3"></div>
  <div class="scanlines"></div>
  <div class="border-line"></div>

  <div class="content">
    <div class="badge">${badge}</div>
    <h1 class="headline">${headline}</h1>
    <p class="subheadline">${subheadline}</p>
    <div class="cta-btn">${cta}</div>
  </div>

  <div class="deco-right">
    <div class="ai-orb">
      <span class="ai-text">AI</span>
    </div>
    <!-- パーティクル装飾 -->
    <div class="particle" style="width:6px;height:6px;top:120px;right:80px;box-shadow:0 0 10px rgba(100,180,255,0.8)"></div>
    <div class="particle" style="width:4px;height:4px;top:200px;right:160px;box-shadow:0 0 8px rgba(100,180,255,0.8)"></div>
    <div class="particle" style="width:8px;height:8px;bottom:140px;right:100px;box-shadow:0 0 12px rgba(255,200,0,0.8);background:rgba(255,200,0,0.6)"></div>
    <div class="particle" style="width:5px;height:5px;bottom:200px;right:60px;box-shadow:0 0 8px rgba(100,180,255,0.8)"></div>
  </div>
</body>
</html>`;
}

function createBenefitsSection({ title, benefits, theme }) {
  const isDark = theme === 'red-dramatic';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 700px; overflow: hidden;
    background: ${isDark
      ? 'linear-gradient(135deg, #1a0000 0%, #2d0505 30%, #1a0a0a 60%, #0d0000 100%)'
      : 'linear-gradient(135deg, #f8f9ff 0%, #eef3ff 100%)'};
    font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
    padding: 48px 60px;
  }

  ${isDark ? `
  .bg-glow {
    position: fixed; inset: 0; pointer-events: none;
  }
  .bg-glow::before {
    content: '';
    position: absolute;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(200,0,0,0.15), transparent 70%);
    top: -100px; left: -100px;
    border-radius: 50%;
  }
  .bg-glow::after {
    content: '';
    position: absolute;
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(200,0,0,0.1), transparent 70%);
    bottom: -80px; right: -80px;
    border-radius: 50%;
  }
  ` : ''}

  .section-title {
    text-align: center;
    font-size: 34px;
    font-weight: 900;
    margin-bottom: 40px;
    color: ${isDark ? '#ffffff' : '#1a1a2e'};
    ${isDark ? `
    text-shadow: 0 0 30px rgba(255,100,100,0.5);
    ` : ''}
  }

  .section-title span {
    background: ${isDark
      ? 'linear-gradient(90deg, #ff6b6b, #ff9999, #ffcccc)'
      : 'linear-gradient(90deg, #2563eb, #7c3aed)'};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .benefits-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .benefit-card {
    background: ${isDark
      ? 'rgba(255,255,255,0.06)'
      : '#ffffff'};
    border: 1px solid ${isDark
      ? 'rgba(255,100,100,0.2)'
      : 'rgba(37,99,235,0.12)'};
    border-radius: 12px;
    padding: 20px;
    ${isDark ? `
    box-shadow:
      0 4px 20px rgba(0,0,0,0.4),
      0 0 0 1px rgba(255,80,80,0.1);
    ` : `
    box-shadow: 0 2px 12px rgba(37,99,235,0.08);
    `}
  }

  .benefit-icon {
    font-size: 28px;
    margin-bottom: 10px;
    display: block;
  }

  .benefit-title {
    font-size: 15px;
    font-weight: 800;
    color: ${isDark ? '#fff' : '#1a1a2e'};
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .benefit-desc {
    font-size: 12.5px;
    color: ${isDark ? 'rgba(255,220,220,0.7)' : '#666'};
    line-height: 1.6;
  }

  .check-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px; height: 20px;
    background: ${isDark
      ? 'linear-gradient(135deg, #ff4444, #ff8888)'
      : 'linear-gradient(135deg, #2563eb, #7c3aed)'};
    border-radius: 50%;
    font-size: 11px;
    color: white;
    font-weight: 700;
    margin-right: 8px;
    flex-shrink: 0;
  }

  .title-wrapper {
    display: flex;
    align-items: flex-start;
    gap: 4px;
  }
</style>
</head>
<body>
  ${isDark ? '<div class="bg-glow"></div>' : ''}

  <h2 class="section-title"><span>${title}</span></h2>

  <div class="benefits-grid">
    ${benefits.map(b => `
    <div class="benefit-card">
      <span class="benefit-icon">${b.icon}</span>
      <div class="title-wrapper">
        <span class="check-mark">✓</span>
        <div class="benefit-title">${b.title}</div>
      </div>
      <p class="benefit-desc">${b.desc}</p>
    </div>
    `).join('')}
  </div>
</body>
</html>`;
}

function createStatsSection({ headline, stats, theme }) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 500px; overflow: hidden;
    background: url('') center/cover,
      linear-gradient(135deg, rgba(240,245,255,0.97) 0%, rgba(230,240,255,0.97) 100%);
    background-color: #f0f4ff;
    font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
    padding: 56px 80px;
    position: relative;
  }

  /* 背景パターン */
  body::before {
    content: '';
    position: absolute; inset: 0;
    background-image:
      radial-gradient(circle at 20% 50%, rgba(37,99,235,0.06) 0%, transparent 50%),
      radial-gradient(circle at 80% 50%, rgba(124,58,237,0.06) 0%, transparent 50%);
  }

  .headline {
    text-align: center;
    font-size: 32px;
    font-weight: 900;
    color: #1a1a2e;
    margin-bottom: 48px;
    position: relative;
  }

  .headline::after {
    content: '';
    display: block;
    width: 60px; height: 4px;
    background: linear-gradient(90deg, #2563eb, #7c3aed);
    border-radius: 2px;
    margin: 12px auto 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    position: relative;
  }

  .stat-card {
    background: #ffffff;
    border-radius: 16px;
    padding: 28px 20px;
    text-align: center;
    box-shadow: 0 4px 24px rgba(37,99,235,0.1), 0 1px 4px rgba(0,0,0,0.06);
    border: 1px solid rgba(37,99,235,0.08);
  }

  .stat-value {
    font-size: 42px;
    font-weight: 900;
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.1;
    margin-bottom: 8px;
  }

  .stat-label {
    font-size: 13px;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 6px;
    line-height: 1.4;
  }

  .stat-sub {
    font-size: 11px;
    color: #888;
    line-height: 1.5;
  }

  .stat-divider {
    width: 30px; height: 2px;
    background: linear-gradient(90deg, #2563eb, #7c3aed);
    border-radius: 1px;
    margin: 10px auto;
  }
</style>
</head>
<body>
  <h2 class="headline">${headline}</h2>

  <div class="stats-grid">
    ${stats.map(s => `
    <div class="stat-card">
      <div class="stat-value">${s.value}</div>
      <div class="stat-divider"></div>
      <div class="stat-label">${s.label}</div>
      <div class="stat-sub">${s.sub}</div>
    </div>
    `).join('')}
  </div>
</body>
</html>`;
}

function createCTAButton({ text, sub }) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 600px; height: 100px; overflow: hidden;
    background: transparent;
    font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cta-wrapper {
    width: 100%;
  }

  .cta-btn {
    width: 100%;
    background: linear-gradient(90deg, #e65c00, #f9a825, #e65c00);
    background-size: 200% 100%;
    border-radius: 10px;
    padding: 18px 36px;
    text-align: center;
    border: 2px solid rgba(255,200,50,0.4);
    box-shadow:
      0 8px 32px rgba(230,92,0,0.5),
      0 0 0 1px rgba(255,180,0,0.3),
      inset 0 1px 0 rgba(255,255,255,0.2);
    position: relative;
    overflow: hidden;
  }

  .cta-btn::before {
    content: '';
    position: absolute;
    top: 0; left: -100%; width: 60px; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    transform: skewX(-20deg);
  }

  .cta-text {
    font-size: 22px;
    font-weight: 900;
    color: #fff;
    letter-spacing: 0.03em;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    display: block;
  }

  .cta-sub {
    font-size: 11px;
    color: rgba(255,255,200,0.9);
    margin-top: 4px;
    display: block;
  }
</style>
</head>
<body>
  <div class="cta-wrapper">
    <div class="cta-btn">
      <span class="cta-text">🔥 ${text}</span>
      <span class="cta-sub">${sub}</span>
    </div>
  </div>
</body>
</html>`;
}

function createMagazineCover({ title, subtitle, badge, price }) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 700px; overflow: hidden;
    background: linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 40%, #0a1a3e 70%, #050a14 100%);
    font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
    position: relative;
  }

  /* 背景装飾 */
  .bg-elements {
    position: absolute; inset: 0; pointer-events: none;
  }

  .hexagon {
    position: absolute;
    opacity: 0.08;
  }

  .hex1 {
    width: 300px; height: 300px;
    background: linear-gradient(135deg, #2563eb, transparent);
    border-radius: 50%;
    top: -50px; right: 50px;
    filter: blur(40px);
  }

  .hex2 {
    width: 400px; height: 400px;
    background: linear-gradient(225deg, #7c3aed, transparent);
    border-radius: 50%;
    bottom: -100px; right: 100px;
    filter: blur(60px);
    opacity: 0.15;
  }

  /* グリッドライン */
  .grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(80,120,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(80,120,255,0.03) 1px, transparent 1px);
    background-size: 50px 50px;
  }

  /* メインコンテンツ */
  .content {
    position: relative; z-index: 10;
    display: flex;
    height: 100%;
  }

  /* 左パネル */
  .left-panel {
    flex: 1;
    padding: 60px 60px 60px 70px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    border-right: 1px solid rgba(255,255,255,0.06);
  }

  .badge-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(37,99,235,0.3);
    border: 1px solid rgba(80,140,255,0.4);
    border-radius: 4px;
    padding: 6px 16px;
    font-size: 12px;
    font-weight: 700;
    color: #80b4ff;
    margin-bottom: 24px;
    width: fit-content;
    letter-spacing: 0.08em;
  }

  .main-title {
    font-size: 52px;
    font-weight: 900;
    line-height: 1.2;
    white-space: pre-line;
    margin-bottom: 24px;
    background: linear-gradient(180deg, #ffffff 0%, #c0d8ff 50%, #8ab4ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .sub-title {
    font-size: 20px;
    font-weight: 700;
    line-height: 1.6;
    white-space: pre-line;
    color: rgba(200,220,255,0.8);
    margin-bottom: 32px;
    border-left: 3px solid #4080ff;
    padding-left: 16px;
  }

  .price-badge {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: linear-gradient(90deg, rgba(255,200,0,0.15), rgba(255,150,0,0.1));
    border: 1px solid rgba(255,200,0,0.3);
    border-radius: 8px;
    padding: 12px 20px;
    width: fit-content;
  }

  .price-text {
    font-size: 14px;
    color: #ffd700;
    font-weight: 700;
  }

  /* 右パネル - AI 3D文字 */
  .right-panel {
    width: 460px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 24px;
    position: relative;
    padding: 40px;
  }

  /* AI ゴールド 3D テキスト */
  .ai-3d-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ai-3d-text {
    font-size: 160px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -10px;
    /* 3D ゴールドエフェクト */
    background: linear-gradient(
      180deg,
      #fffde0 0%,
      #ffd700 20%,
      #ffb800 40%,
      #ff8c00 55%,
      #ffd700 70%,
      #ffe066 85%,
      #fff8c0 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter:
      drop-shadow(0 4px 0 rgba(120,60,0,0.6))
      drop-shadow(0 8px 16px rgba(200,100,0,0.4))
      drop-shadow(0 0 40px rgba(255,200,0,0.3));
    text-shadow: none;
    position: relative;
  }

  /* 輝きエフェクト */
  .ai-glow {
    position: absolute;
    width: 300px; height: 200px;
    background: radial-gradient(ellipse, rgba(255,200,0,0.2) 0%, transparent 70%);
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  /* デバイスモックアップエリア */
  .devices-row {
    display: flex;
    gap: 20px;
    align-items: flex-end;
  }

  .device-kindle {
    width: 90px; height: 120px;
    background: linear-gradient(135deg, #1a1a2e, #2a2a4e);
    border-radius: 8px;
    border: 2px solid rgba(100,120,255,0.4);
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 4px;
    padding: 8px;
  }

  .device-text {
    font-size: 8px;
    color: rgba(180,200,255,0.7);
    text-align: center;
    font-weight: 600;
    line-height: 1.3;
  }

  .device-icon {
    font-size: 24px;
  }

  .device-phone {
    width: 56px; height: 100px;
    background: linear-gradient(135deg, #1a1a2e, #2a2a4e);
    border-radius: 10px;
    border: 2px solid rgba(100,120,255,0.4);
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* スター装飾 */
  .star {
    position: absolute;
    color: #ffd700;
    font-size: 16px;
    opacity: 0.7;
  }
</style>
</head>
<body>
  <div class="bg-elements">
    <div class="hexagon hex1"></div>
    <div class="hexagon hex2"></div>
  </div>
  <div class="grid"></div>

  <div class="content">
    <div class="left-panel">
      <div class="badge-label">📚 ${badge}</div>
      <h1 class="main-title">${title}</h1>
      <p class="sub-title">${subtitle}</p>
      <div class="price-badge">
        <span class="price-text">💰 ${price}</span>
      </div>
    </div>

    <div class="right-panel">
      <div class="ai-3d-wrapper">
        <div class="ai-glow"></div>
        <div class="ai-3d-text">AI</div>
        <div class="star" style="top:30px;right:40px">✦</div>
        <div class="star" style="top:60px;right:20px;font-size:10px">✦</div>
        <div class="star" style="bottom:40px;left:20px;font-size:12px">✦</div>
      </div>

      <div class="devices-row">
        <div class="device-kindle">
          <div class="device-icon">📖</div>
          <div class="device-text">AI副業\n完全攻略\nバイブル</div>
        </div>
        <div class="device-phone">
          <div class="device-icon" style="font-size:20px">📱</div>
        </div>
        <div class="device-kindle" style="height:100px">
          <div class="device-icon">💻</div>
          <div class="device-text">特典\nレポート</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// --- メイン処理 ---

async function generateImages() {
  console.log('🚀 LP セクション画像生成開始...\n');

  // 出力ディレクトリ確認
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  let successCount = 0;

  for (const section of LP_SECTIONS) {
    const outputPath = path.join(OUTPUT_DIR, section.filename);
    console.log(`📸 生成中: ${section.id}...`);

    try {
      const page = await browser.newPage();
      await page.setViewportSize({ width: section.width, height: section.height });
      await page.setContent(section.html, { waitUntil: 'networkidle' });

      // フォント読み込み待機
      await page.waitForTimeout(500);

      await page.screenshot({
        path: outputPath,
        clip: { x: 0, y: 0, width: section.width, height: section.height },
        type: 'png',
      });

      await page.close();

      const stat = fs.statSync(outputPath);
      console.log(`  ✅ 保存完了: ${section.filename} (${Math.round(stat.size / 1024)}KB)`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ エラー: ${section.id}: ${error.message}`);
    }
  }

  await browser.close();

  console.log(`\n✨ 完了! ${successCount}/${LP_SECTIONS.length} 画像を生成しました`);
  console.log(`📁 保存場所: ${OUTPUT_DIR}`);
}

generateImages().catch(console.error);
