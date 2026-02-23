"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface PageData {
  id: string;
  name: string;
  slug: string;
  content: Record<string, unknown>[];
}

interface ActiveVariant {
  id: string;
  testId: string;
  weight: number;
}

interface LPPageClientProps {
  page: PageData;
  funnelId: string;
  nextPageSlug: string | null;
  activeVariants: ActiveVariant[];
}

/**
 * 公開LPページ クライアントコンポーネント
 * PV計測・A/Bバリアント選択・コンポーネントレンダリングを担当
 */
export function LPPageClient({
  page,
  funnelId,
  nextPageSlug,
  activeVariants,
}: LPPageClientProps) {
  const router = useRouter();
  const tracked = useRef(false);

  // バリアントを重み付きでランダム選択
  const selectedVariant =
    activeVariants.length > 0 ? selectVariant(activeVariants) : null;

  // ページビュー計測（初回のみ）
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    void fetch(`/api/funnels/${funnelId}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: page.id,
        event: "view",
        variantId: selectedVariant?.id,
      }),
    });
  }, [funnelId, page.id, selectedVariant]);

  // コンバージョン記録 & 次ページ遷移
  const handleConversion = async () => {
    await fetch(`/api/funnels/${funnelId}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: page.id,
        event: "conversion",
        variantId: selectedVariant?.id,
      }),
    });

    if (nextPageSlug) {
      router.push(`/p/${funnelId}/${nextPageSlug}`);
    }
  };

  const components = page.content;

  return (
    <main className="min-h-screen bg-white">
      {components.map((comp, idx) => (
        <ComponentRenderer
          key={comp.id as string ?? idx}
          component={comp}
          onConversion={handleConversion}
          nextPageSlug={nextPageSlug}
        />
      ))}
      {components.length === 0 && (
        <div className="flex h-screen items-center justify-center text-gray-400">
          <p>このページにはコンテンツがありません</p>
        </div>
      )}
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// バリアント選択ロジック
// ─────────────────────────────────────────────────────────────────────────────
function selectVariant(variants: ActiveVariant[]): ActiveVariant {
  const total = variants.reduce((s, v) => s + v.weight, 0);
  let rand = Math.random() * total;
  for (const v of variants) {
    rand -= v.weight;
    if (rand <= 0) return v;
  }
  return variants[variants.length - 1];
}

// ─────────────────────────────────────────────────────────────────────────────
// コンポーネントレンダラー
// ─────────────────────────────────────────────────────────────────────────────
interface RendererProps {
  component: Record<string, unknown>;
  onConversion: () => void;
  nextPageSlug: string | null;
}

function ComponentRenderer({ component, onConversion, nextPageSlug }: RendererProps) {
  const type = (component.componentType as string) ?? "";
  const props = (component.props as Record<string, unknown>) ?? {};

  const getString = (key: string, fallback = "") =>
    (props[key] as string | undefined) ?? fallback;

  const bgColor = getString("backgroundColor", "#ffffff");
  const textColor = getString("textColor", "#111827");
  const btnColor = getString("buttonColor", "#4f46e5");
  const btnText = getString("buttonTextColor", "#ffffff");

  const sectionStyle: React.CSSProperties = {
    backgroundColor: bgColor,
    color: textColor,
  };

  // ─── Hero / ヒーローセクション ───
  if (type.startsWith("hero") || type === "landing") {
    const imageUrl = getString("imageUrl");
    const headline = getString("headline");
    const subheadline = getString("subheadline");
    const ctaText = getString("ctaText");
    const description = getString("description");

    return (
      <section
        style={{
          ...sectionStyle,
          backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="relative py-24 px-4"
      >
        {imageUrl && (
          <div className="absolute inset-0 bg-black/40" />
        )}
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          {headline && (
            <h1
              className="mb-4 text-4xl font-extrabold leading-tight md:text-6xl"
              style={{ color: imageUrl ? "#fff" : textColor }}
            >
              {headline}
            </h1>
          )}
          {subheadline && (
            <p
              className="mb-4 text-xl md:text-2xl"
              style={{ color: imageUrl ? "#e5e7eb" : textColor }}
            >
              {subheadline}
            </p>
          )}
          {description && (
            <p
              className="mb-8 text-lg"
              style={{ color: imageUrl ? "#d1d5db" : textColor }}
            >
              {description}
            </p>
          )}
          {ctaText && (
            <button
              onClick={onConversion}
              style={{ backgroundColor: btnColor, color: btnText }}
              className="rounded-lg px-10 py-4 text-xl font-bold shadow-lg hover:opacity-90 transition-opacity"
            >
              {ctaText}
            </button>
          )}
        </div>
      </section>
    );
  }

  // ─── 画像 ───
  if (type === "image") {
    const imageUrl = getString("imageUrl");
    const alt = getString("alt", "");
    const width = getString("width", "100%");
    if (!imageUrl) return null;
    return (
      <section style={sectionStyle} className="flex justify-center">
        <img
          src={imageUrl}
          alt={alt}
          style={{ width, maxWidth: "100%", display: "block" }}
        />
      </section>
    );
  }

  // ─── ヘッドライン / テキスト ───
  if (type === "headline" || type === "heading") {
    const text = getString("text") || getString("headline");
    const level = (props["level"] as number) ?? 2;
    const Tag = `h${Math.min(Math.max(level, 1), 6)}` as "h1" | "h2" | "h3" | "h4";
    return (
      <section style={sectionStyle} className="py-8 px-4 text-center">
        <div className="mx-auto max-w-4xl">
          <Tag className="text-3xl font-bold md:text-4xl">{text}</Tag>
        </div>
      </section>
    );
  }

  // ─── テキスト / 段落 ───
  if (type === "text" || type === "paragraph" || type === "body") {
    const text = getString("text") || getString("content");
    return (
      <section style={sectionStyle} className="py-6 px-4">
        <div
          className="mx-auto max-w-4xl text-lg leading-relaxed"
          dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, "<br/>") }}
        />
      </section>
    );
  }

  // ─── CTA ボタン ───
  if (
    type === "cta-button" ||
    type === "button" ||
    type === "cta" ||
    type === "next-link"
  ) {
    const label = getString("buttonText") || getString("text") || getString("ctaText") || "次へ進む";
    const href = getString("href");

    if (href && !nextPageSlug) {
      return (
        <section style={sectionStyle} className="py-8 px-4 text-center">
          <a
            href={href}
            style={{ backgroundColor: btnColor, color: btnText }}
            className="inline-block rounded-lg px-10 py-4 text-xl font-bold shadow-lg hover:opacity-90 transition-opacity"
          >
            {label}
          </a>
        </section>
      );
    }

    return (
      <section style={sectionStyle} className="py-8 px-4 text-center">
        <button
          onClick={onConversion}
          style={{ backgroundColor: btnColor, color: btnText }}
          className="rounded-lg px-10 py-4 text-xl font-bold shadow-lg hover:opacity-90 transition-opacity"
        >
          {label}
        </button>
      </section>
    );
  }

  // ─── 証言 / 口コミ ───
  if (type.includes("testimonial")) {
    const author = getString("author") || getString("name");
    const content = getString("content") || getString("text");
    const rating = (props["rating"] as number) ?? 5;

    return (
      <section style={sectionStyle} className="py-10 px-4">
        <div className="mx-auto max-w-2xl rounded-xl border bg-white p-8 shadow">
          <div className="mb-2 flex gap-1 text-yellow-400">
            {"★".repeat(Math.min(rating, 5))}
          </div>
          <p className="mb-4 text-lg leading-relaxed">&ldquo;{content}&rdquo;</p>
          <p className="font-semibold">— {author}</p>
        </div>
      </section>
    );
  }

  // ─── 特徴 / ベネフィット ───
  if (type.includes("feature") || type.includes("benefit")) {
    const title = getString("title") || getString("headline");
    const description = getString("description") || getString("text");
    const icon = getString("icon", "✓");

    return (
      <section style={sectionStyle} className="py-8 px-4">
        <div className="mx-auto flex max-w-4xl items-start gap-4">
          <div className="flex-shrink-0 text-3xl">{icon}</div>
          <div>
            {title && <h3 className="mb-2 text-xl font-bold">{title}</h3>}
            {description && <p className="text-lg leading-relaxed">{description}</p>}
          </div>
        </div>
      </section>
    );
  }

  // ─── 区切り線 ───
  if (type === "divider") {
    return <hr className="my-8 border-t border-gray-200" />;
  }

  // ─── スペーサー ───
  if (type === "spacer") {
    const height = (props["height"] as number) ?? 40;
    return <div style={{ height }} />;
  }

  // ─── 保証 ───
  if (type.includes("guarantee")) {
    const title = getString("title", "返金保証");
    const description = getString("description");
    const days = getString("days", "30");

    return (
      <section style={sectionStyle} className="py-10 px-4">
        <div className="mx-auto max-w-3xl rounded-xl border-2 border-green-400 bg-green-50 p-8 text-center">
          <div className="mb-3 text-5xl">🛡️</div>
          <h3 className="mb-2 text-2xl font-bold text-green-800">
            {days}日間 {title}
          </h3>
          {description && (
            <p className="text-green-700 leading-relaxed">{description}</p>
          )}
        </div>
      </section>
    );
  }

  // ─── カウントダウン ───
  if (type.includes("countdown") || type.includes("timer")) {
    const label = getString("label", "残り時間");
    const targetDate = getString("targetDate");

    return (
      <section style={sectionStyle} className="py-8 px-4 text-center">
        <CountdownTimer label={label} targetDate={targetDate} />
      </section>
    );
  }

  // ─── 動画 ───
  if (type === "video") {
    const videoUrl = getString("videoUrl") || getString("src");
    if (!videoUrl) return null;

    const isYoutube =
      videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
    const isVimeo = videoUrl.includes("vimeo.com");

    if (isYoutube || isVimeo) {
      const embedUrl = isYoutube
        ? videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")
        : videoUrl.replace("vimeo.com/", "player.vimeo.com/video/");

      return (
        <section style={sectionStyle} className="py-8 px-4">
          <div className="mx-auto max-w-4xl">
            <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-xl shadow-lg">
              <iframe
                src={embedUrl}
                className="absolute inset-0 h-full w-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          </div>
        </section>
      );
    }

    return (
      <section style={sectionStyle} className="py-8 px-4">
        <div className="mx-auto max-w-4xl">
          <video
            src={videoUrl}
            controls
            className="w-full rounded-xl shadow-lg"
          />
        </div>
      </section>
    );
  }

  // ─── ヘッダー / フッター ───
  if (type === "header") {
    const logoText = getString("logoText") || getString("title");
    return (
      <header
        style={sectionStyle}
        className="flex items-center justify-between border-b px-6 py-4 shadow-sm"
      >
        <span className="text-xl font-bold">{logoText}</span>
      </header>
    );
  }

  if (type === "footer") {
    const text = getString("text") || getString("copyright");
    return (
      <footer
        style={{ ...sectionStyle, backgroundColor: sectionStyle.backgroundColor || "#111827" }}
        className="py-8 px-4 text-center text-sm text-gray-400"
      >
        {text}
      </footer>
    );
  }

  // ─── FAQ ───
  if (type === "faq" || type === "accordion") {
    const question = getString("question");
    const answer = getString("answer") || getString("content");
    return (
      <section style={sectionStyle} className="py-6 px-4">
        <div className="mx-auto max-w-4xl rounded-lg border p-6">
          {question && <h4 className="mb-2 font-bold text-lg">Q. {question}</h4>}
          {answer && <p className="text-gray-600 leading-relaxed">A. {answer}</p>}
        </div>
      </section>
    );
  }

  // ─── 統計 / ソーシャルプルーフ ───
  if (type === "stats" || type === "social-proof" || type === "number") {
    const value = getString("value");
    const label = getString("label");
    const prefix = getString("prefix", "");
    const suffix = getString("suffix", "");

    return (
      <section style={sectionStyle} className="py-8 px-4 text-center">
        <div className="mx-auto max-w-xs">
          <p className="text-5xl font-extrabold">
            {prefix}{value}{suffix}
          </p>
          {label && <p className="mt-2 text-lg text-gray-500">{label}</p>}
        </div>
      </section>
    );
  }

  // ─── カスタムHTML ───
  if (type === "custom-html" || type === "html") {
    const html = getString("html") || getString("content");
    return (
      <section
        style={sectionStyle}
        className="py-4 px-4"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // ─── デフォルト（未知のタイプ） ───
  const headline = getString("headline") || getString("title") || getString("text");
  const description = getString("description") || getString("content");
  const ctaText = getString("ctaText") || getString("buttonText");

  if (!headline && !description && !ctaText) return null;

  return (
    <section style={sectionStyle} className="py-10 px-4">
      <div className="mx-auto max-w-4xl">
        {headline && <h2 className="mb-4 text-3xl font-bold">{headline}</h2>}
        {description && (
          <p className="mb-6 text-lg leading-relaxed">{description}</p>
        )}
        {ctaText && (
          <button
            onClick={onConversion}
            style={{ backgroundColor: btnColor, color: btnText }}
            className="rounded-lg px-8 py-3 font-bold shadow hover:opacity-90 transition-opacity"
          >
            {ctaText}
          </button>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// カウントダウンタイマー
// ─────────────────────────────────────────────────────────────────────────────
function CountdownTimer({ label, targetDate }: { label: string; targetDate: string }) {
  // シンプルなカウントダウン表示（初期値のみ — hydration問題を回避）
  const target = targetDate ? new Date(targetDate).getTime() : Date.now() + 24 * 3600 * 1000;
  const now = Date.now();
  const diff = Math.max(0, target - now);

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div>
      <p className="mb-2 text-sm font-medium uppercase tracking-widest text-gray-500">
        {label}
      </p>
      <div className="flex justify-center gap-4 text-5xl font-extrabold">
        <span>{pad(hours)}<span className="block text-xs text-gray-400">時間</span></span>
        <span>:</span>
        <span>{pad(minutes)}<span className="block text-xs text-gray-400">分</span></span>
        <span>:</span>
        <span>{pad(seconds)}<span className="block text-xs text-gray-400">秒</span></span>
      </div>
    </div>
  );
}
