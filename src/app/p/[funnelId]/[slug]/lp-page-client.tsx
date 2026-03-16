"use client";

import { useEffect, useRef, useState } from "react";
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
  const [ctaRevealed, setCtaRevealed] = useState(false);
  const [bodyRevealed, setBodyRevealed] = useState(false);

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

  // 動画再生時間ベースの表示制御コールバック
  const handleVideoTimeUpdate = (currentTime: number) => {
    if (!ctaRevealed && currentTime >= 30) {
      setCtaRevealed(true);
    }
    if (!bodyRevealed && currentTime >= 60) {
      setBodyRevealed(true);
    }
  };

  // 動画プレーヤーがない場合のフォールバック（タイマーベース）
  useEffect(() => {
    const hasVideoPlayer = components.some(
      (c) => (c.type as string) === "lp-video-player"
    );
    if (hasVideoPlayer) return;

    const revealComp = components.find(
      (c) => (c.props as Record<string, unknown>)?.revealAfterSeconds
    );
    if (!revealComp) {
      setCtaRevealed(true);
      setBodyRevealed(true);
      return;
    }
    const delay = Number(
      (revealComp.props as Record<string, unknown>).revealAfterSeconds
    );
    if (!delay || delay <= 0) {
      setCtaRevealed(true);
      setBodyRevealed(true);
      return;
    }
    const ctaTimer = setTimeout(() => setCtaRevealed(true), 30 * 1000);
    const bodyTimer = setTimeout(() => setBodyRevealed(true), delay * 1000);
    return () => {
      clearTimeout(ctaTimer);
      clearTimeout(bodyTimer);
    };
  }, [page.content]);

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

  // ヘッダー / CTA（30秒後表示） / ボディ（60秒後表示）に3分割
  const headerComponents: Record<string, unknown>[] = [];
  const ctaComponents: Record<string, unknown>[] = [];
  const bodyComponents: Record<string, unknown>[] = [];
  for (const comp of components) {
    const compProps = (comp.props as Record<string, unknown>) ?? {};
    const revealGroup = compProps.revealGroup as string | undefined;
    if (revealGroup === "cta") {
      ctaComponents.push(comp);
    } else if (compProps.revealAfterSeconds) {
      bodyComponents.push(comp);
    } else {
      headerComponents.push(comp);
    }
  }

  return (
    <main className="min-h-screen bg-black">
      <div className="mx-auto w-full max-w-[800px]">
        {headerComponents.map((comp, idx) => (
          <ComponentRenderer
            key={(comp.id as string) ?? idx}
            component={comp}
            onConversion={handleConversion}
            nextPageSlug={nextPageSlug}
            onVideoTimeUpdate={handleVideoTimeUpdate}
          />
        ))}
        {ctaComponents.length > 0 && (
          <div
            className={`transition-all duration-700 ${
              ctaRevealed
                ? "opacity-100 max-h-[999999px]"
                : "opacity-0 max-h-0 overflow-hidden"
            }`}
          >
            {ctaComponents.map((comp, idx) => (
              <ComponentRenderer
                key={(comp.id as string) ?? `cta-${idx}`}
                component={comp}
                onConversion={handleConversion}
                nextPageSlug={nextPageSlug}
              />
            ))}
          </div>
        )}
        {bodyComponents.length > 0 && (
          <div
            className={`transition-all duration-1000 ${
              bodyRevealed
                ? "opacity-100 max-h-[999999px]"
                : "opacity-0 max-h-0 overflow-hidden"
            }`}
          >
            {bodyComponents.map((comp, idx) => (
              <ComponentRenderer
                key={(comp.id as string) ?? `body-${idx}`}
                component={comp}
                onConversion={handleConversion}
                nextPageSlug={nextPageSlug}
              />
            ))}
          </div>
        )}
        {components.length === 0 && (
          <div className="flex h-screen items-center justify-center text-gray-400">
            <p>このページにはコンテンツがありません</p>
          </div>
        )}
      </div>
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
  onVideoTimeUpdate?: (currentTime: number) => void;
}

function ComponentRenderer({ component, onConversion, nextPageSlug, onVideoTimeUpdate }: RendererProps) {
  const type = (component.componentType as string) ?? (component.type as string) ?? "";
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

  // ─── LP動画プレーヤー（再生時間で表示制御） ───
  if (type === "lp-video-player") {
    const videoUrl = getString("videoUrl");
    const poster = getString("poster");
    if (!videoUrl) return null;
    return (
      <section style={sectionStyle} className="w-full">
        <video
          src={videoUrl}
          poster={poster || undefined}
          controls
          playsInline
          preload="metadata"
          onTimeUpdate={(e) => {
            const video = e.currentTarget;
            onVideoTimeUpdate?.(video.currentTime);
          }}
          className="w-full h-auto block"
        />
      </section>
    );
  }

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

  // ─── セクション画像（フルワイド） ───
  if (type === "section-image") {
    const src = getString("src");
    const alt = getString("alt", "");
    if (!src) return null;
    return (
      <section style={sectionStyle} className="w-full">
        <img
          src={src}
          alt={alt}
          className="w-full h-auto block"
          loading="lazy"
        />
      </section>
    );
  }

  // ─── CTA画像（クリック可能な画像ボタン） ───
  if (type === "cta-image") {
    const src = getString("src");
    const alt = getString("alt", "");
    const href = getString("href");
    if (!src) return null;
    const handleClick = () => {
      onConversion?.();
      if (href) window.open(href, "_blank", "noopener,noreferrer");
    };
    return (
      <section style={sectionStyle} className="w-full">
        <button
          onClick={handleClick}
          className="w-full cursor-pointer border-0 bg-transparent p-0 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <img
            src={src}
            alt={alt}
            className="w-full h-auto block"
            loading="lazy"
          />
        </button>
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

  // ─── サブヘッドライン ───
  if (type === "subhead") {
    const text = getString("text") || getString("subhead");
    return (
      <section style={sectionStyle} className="py-4 px-4 text-center">
        <div className="mx-auto max-w-4xl">
          <h3 className="text-2xl font-semibold">{text}</h3>
        </div>
      </section>
    );
  }

  // ─── ボレットリスト ───
  if (type === "bullet") {
    const rawItems = getString("items");
    const icon = getString("icon", "check");
    const iconColor = getString("iconColor", "#4f46e5");
    const items = rawItems.split("\n").filter(Boolean);
    const iconMap: Record<string, string> = {
      check: "✓",
      circle: "●",
      arrow: "→",
      star: "★",
    };
    const iconChar = iconMap[icon] ?? "✓";
    return (
      <section style={sectionStyle} className="py-8 px-4">
        <ul className="mx-auto max-w-3xl space-y-3">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-lg">
              <span style={{ color: iconColor }} className="flex-shrink-0 font-bold text-xl leading-snug">
                {iconChar}
              </span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  // ─── 吹き出し ───
  if (type === "speech-bubble") {
    const text = getString("text");
    const avatar = getString("avatar");
    const name = getString("name");
    const position = getString("position", "left");
    const bubbleBg = getString("backgroundColor", "#f3f4f6");
    const isRight = position === "right";
    return (
      <section style={sectionStyle} className="py-6 px-4">
        <div className={`mx-auto flex max-w-2xl items-end gap-3 ${isRight ? "flex-row-reverse" : "flex-row"}`}>
          {avatar && (
            <img src={avatar} alt={name} className="h-12 w-12 flex-shrink-0 rounded-full object-cover" />
          )}
          <div>
            {name && <p className={`mb-1 text-xs text-gray-500 ${isRight ? "text-right" : ""}`}>{name}</p>}
            <div
              style={{ backgroundColor: bubbleBg }}
              className={`relative rounded-2xl px-5 py-3 text-base leading-relaxed shadow ${
                isRight ? "rounded-br-none" : "rounded-bl-none"
              }`}
            >
              {text}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ─── 画像＋テキスト ───
  if (type === "imageText") {
    const imgSrc = getString("image") || getString("imageUrl");
    const title = getString("title");
    const text = getString("text") || getString("description");
    const imagePosition = getString("imagePosition", "left");
    const imageWidth = getString("imageWidth", "40%");
    const isRight = imagePosition === "right";
    return (
      <section style={sectionStyle} className="py-10 px-4">
        <div className={`mx-auto flex max-w-5xl flex-col items-center gap-8 md:flex-row ${isRight ? "md:flex-row-reverse" : ""}`}>
          {imgSrc && (
            <img src={imgSrc} alt={title} style={{ width: imageWidth, maxWidth: "100%" }} className="rounded-xl object-cover shadow" />
          )}
          <div className="flex-1">
            {title && <h3 className="mb-3 text-2xl font-bold">{title}</h3>}
            {text && <p className="text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, "<br/>") }} />}
          </div>
        </div>
      </section>
    );
  }

  // ─── 表 ───
  if (type === "table") {
    const rawData = getString("data");
    const headerBg = getString("headerBg", "#4f46e5");
    const borderColor = getString("borderColor", "#e5e7eb");
    const rows = rawData.split("\n").filter(Boolean).map((r) => r.split("|"));
    const [header, ...bodyRows] = rows;
    return (
      <section style={sectionStyle} className="py-8 px-4 overflow-x-auto">
        <div className="mx-auto max-w-4xl">
          <table className="w-full border-collapse text-sm">
            {header && (
              <thead>
                <tr>
                  {header.map((cell, i) => (
                    <th
                      key={i}
                      style={{ backgroundColor: headerBg, borderColor }}
                      className="border px-4 py-2 text-left font-semibold text-white"
                    >
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {bodyRows.map((row, ri) => (
                <tr key={ri} className="even:bg-gray-50">
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ borderColor }} className="border px-4 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  // ─── 音声 ───
  if (type === "audio") {
    const audioUrl = getString("audioUrl") || getString("src");
    if (!audioUrl) return null;
    return (
      <section style={sectionStyle} className="py-6 px-4">
        <div className="mx-auto max-w-2xl">
          <audio src={audioUrl} controls className="w-full" />
        </div>
      </section>
    );
  }

  // ─── PDF ───
  if (type === "pdf") {
    const pdfUrl = getString("pdfUrl") || getString("src");
    const height = getString("height", "600px");
    if (!pdfUrl) return null;
    return (
      <section style={sectionStyle} className="py-6 px-4">
        <div className="mx-auto max-w-4xl">
          <iframe src={pdfUrl} style={{ width: "100%", height }} className="rounded-xl border shadow" />
        </div>
      </section>
    );
  }

  // ─── 動画メニュー ───
  if (type === "videoMenu") {
    const rawVideos = getString("videos");
    const layout = getString("layout", "grid");
    const items = rawVideos.split("\n").filter(Boolean).map((v) => {
      const [title, url] = v.split("|");
      return { title: title ?? "", url: url ?? "" };
    });
    return (
      <section style={sectionStyle} className="py-8 px-4">
        <div className={`mx-auto max-w-5xl ${layout === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-3"}`}>
          {items.map((item, i) => (
            <a key={i} href={item.url} className="group block rounded-xl border bg-white p-4 shadow hover:shadow-md transition-shadow">
              <div className="mb-2 flex h-24 items-center justify-center rounded-lg bg-gray-100 text-4xl">▶</div>
              <p className="font-medium text-gray-800 group-hover:text-indigo-600">{item.title}</p>
            </a>
          ))}
        </div>
      </section>
    );
  }

  // ─── チャプター付き動画 ───
  if (type === "video-chapter") {
    const videoUrl = getString("videoUrl") || getString("src");
    const rawChapters = getString("chapters");
    const chapters = rawChapters.split("\n").filter(Boolean).map((c) => {
      const [time, title] = c.split("|");
      return { time: time ?? "", title: title ?? "" };
    });
    return (
      <section style={sectionStyle} className="py-8 px-4">
        <div className="mx-auto max-w-4xl">
          {videoUrl && (
            <div className="relative mb-6 h-0 overflow-hidden rounded-xl pb-[56.25%] shadow-lg">
              <iframe src={videoUrl} className="absolute inset-0 h-full w-full" allowFullScreen />
            </div>
          )}
          {chapters.length > 0 && (
            <ol className="space-y-2 rounded-xl border p-4">
              {chapters.map((ch, i) => (
                <li key={i} className="flex items-center gap-4 text-sm">
                  <span className="w-14 flex-shrink-0 font-mono text-gray-400">{ch.time}</span>
                  <span className="text-gray-800">{ch.title}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    );
  }

  // ─── 自動ウェビナー ───
  if (type === "auto-webinar") {
    const videoUrl = getString("videoUrl") || getString("src");
    const title = getString("title");
    const ctaText = getString("ctaText", "今すぐ参加する");
    const scheduleType = getString("scheduleType", "always");
    return (
      <section style={sectionStyle} className="py-10 px-4">
        <div className="mx-auto max-w-4xl">
          {title && <h2 className="mb-4 text-center text-2xl font-bold">{title}</h2>}
          <div className="mb-2 flex items-center gap-2 justify-center text-sm text-red-500">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
            {scheduleType === "always" ? "常時配信中" : "スケジュール配信"}
          </div>
          {videoUrl && (
            <div className="relative mb-6 h-0 overflow-hidden rounded-xl pb-[56.25%] shadow-lg">
              <iframe src={videoUrl} className="absolute inset-0 h-full w-full" allowFullScreen />
            </div>
          )}
          <div className="text-center">
            <button
              onClick={onConversion}
              style={{ backgroundColor: btnColor, color: btnText }}
              className="rounded-lg px-10 py-4 text-xl font-bold shadow-lg hover:opacity-90 transition-opacity"
            >
              {ctaText}
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ─── 登録フォーム ───
  if (type === "registration-form") {
    const title = getString("title", "無料登録");
    const fields = getString("fields", "email");
    const buttonText = getString("buttonText", "今すぐ登録する");
    const subText = getString("subText");
    const showName = fields.includes("name");
    const showFullName = fields.includes("full");
    return (
      <section style={sectionStyle} className="py-10 px-4">
        <div className="mx-auto max-w-md rounded-2xl border bg-white p-8 shadow-lg">
          {title && <h3 className="mb-6 text-center text-2xl font-bold">{title}</h3>}
          <div className="space-y-4">
            {showFullName && (
              <>
                <input type="text" placeholder="姓" className="w-full rounded-lg border px-4 py-3 text-base outline-none focus:border-indigo-500" readOnly />
                <input type="text" placeholder="名" className="w-full rounded-lg border px-4 py-3 text-base outline-none focus:border-indigo-500" readOnly />
              </>
            )}
            {showName && !showFullName && (
              <input type="text" placeholder="お名前" className="w-full rounded-lg border px-4 py-3 text-base outline-none focus:border-indigo-500" readOnly />
            )}
            <input type="email" placeholder="メールアドレス" className="w-full rounded-lg border px-4 py-3 text-base outline-none focus:border-indigo-500" readOnly />
          </div>
          <button
            onClick={onConversion}
            style={{ backgroundColor: btnColor, color: btnText }}
            className="mt-6 w-full rounded-lg py-4 text-lg font-bold shadow hover:opacity-90 transition-opacity"
          >
            {buttonText}
          </button>
          {subText && <p className="mt-3 text-center text-xs text-gray-400">{subText}</p>}
        </div>
      </section>
    );
  }

  // ─── カスタムフォーム ───
  if (type === "custom-form") {
    const title = getString("title");
    const rawFields = getString("fields");
    const buttonText = getString("buttonText", "送信する");
    const fieldItems = rawFields.split("\n").filter(Boolean).map((f) => {
      const [name, fieldType] = f.split("|");
      return { name: name ?? "", fieldType: fieldType ?? "text" };
    });
    return (
      <section style={sectionStyle} className="py-10 px-4">
        <div className="mx-auto max-w-md rounded-2xl border bg-white p-8 shadow-lg">
          {title && <h3 className="mb-6 text-center text-2xl font-bold">{title}</h3>}
          <div className="space-y-4">
            {fieldItems.map((f, i) => (
              <div key={i}>
                <label className="mb-1 block text-sm font-medium text-gray-700">{f.name}</label>
                {f.fieldType === "textarea" ? (
                  <textarea placeholder={f.name} rows={3} className="w-full rounded-lg border px-4 py-3 text-base outline-none focus:border-indigo-500" readOnly />
                ) : (
                  <input type={f.fieldType} placeholder={f.name} className="w-full rounded-lg border px-4 py-3 text-base outline-none focus:border-indigo-500" readOnly />
                )}
              </div>
            ))}
          </div>
          <button
            onClick={onConversion}
            style={{ backgroundColor: btnColor, color: btnText }}
            className="mt-6 w-full rounded-lg py-4 text-lg font-bold shadow hover:opacity-90 transition-opacity"
          >
            {buttonText}
          </button>
        </div>
      </section>
    );
  }

  // ─── コメント欄 ───
  if (type === "comment") {
    const title = getString("title", "コメント");
    const placeholder = getString("placeholder", "コメントを入力してください");
    return (
      <section style={sectionStyle} className="py-8 px-4">
        <div className="mx-auto max-w-2xl">
          {title && <h4 className="mb-4 text-xl font-bold">{title}</h4>}
          <textarea
            placeholder={placeholder}
            rows={4}
            className="w-full rounded-xl border px-4 py-3 text-base outline-none focus:border-indigo-500"
            readOnly
          />
          <div className="mt-3 text-right">
            <button
              style={{ backgroundColor: btnColor, color: btnText }}
              className="rounded-lg px-6 py-2 font-semibold shadow hover:opacity-90 transition-opacity"
            >
              送信
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ─── LINE友だち追加ボタン ───
  if (type === "line-add-button") {
    const buttonText = getString("buttonText", "LINEで友だち追加する");
    const subText = getString("subText");
    const lineId = getString("lineId");
    const size = getString("size", "md");
    const sizeClass = size === "lg" ? "py-5 text-xl" : size === "sm" ? "py-2 text-sm" : "py-4 text-lg";
    const href = lineId ? `https://line.me/R/ti/p/${lineId}` : "#";
    return (
      <section style={sectionStyle} className="py-8 px-4 text-center">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ backgroundColor: "#06C755" }}
          className={`inline-flex items-center gap-3 rounded-xl px-10 font-bold text-white shadow-lg hover:opacity-90 transition-opacity ${sizeClass}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <path d="M19.365 9.89c.50 0 .904.404.904.9 0 .497-.403.9-.904.9H17.44v1.344h1.925c.5 0 .904.404.904.9 0 .497-.403.9-.904.9h-2.826a.9.9 0 01-.9-.9V9.89a.9.9 0 01.9-.9zM4.636 13.945a.9.9 0 01-.9-.9V9.89c0-.497.404-.9.9-.9.497 0 .9.403.9.9v3.255h1.925c.5 0 .903.404.903.9 0 .497-.403.9-.903.9zm4.498.0a.9.9 0 01-.9-.9V9.89c0-.497.404-.9.9-.9.497 0 .9.403.9.9v3.155c0 .497-.403.9-.9.9zm2.45-4.055c.497 0 .883.377.902.869l.001.031v2.255l1.484-2.807a.9.9 0 011.585.845L14.04 13.2v.845a.9.9 0 01-1.8 0V9.89c0-.497.403-.9.9-.9z" />
          </svg>
          {buttonText}
        </a>
        {subText && <p className="mt-2 text-sm text-gray-500">{subText}</p>}
      </section>
    );
  }

  // ─── LINE QRコード ───
  if (type === "line-qr") {
    const lineId = getString("lineId");
    const size = parseInt(getString("size", "200"), 10);
    const caption = getString("caption", "QRコードでLINE友だち追加");
    const qrUrl = lineId
      ? `https://qr-official.line.me/gs/M_${lineId}_GW.png`
      : `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=https://line.me/R/ti/p/${lineId}`;
    return (
      <section style={sectionStyle} className="py-8 px-4 text-center">
        <img src={qrUrl} alt="LINE QR" width={size} height={size} className="mx-auto rounded-xl border shadow" />
        {caption && <p className="mt-3 text-sm text-gray-500">{caption}</p>}
      </section>
    );
  }

  // ─── 決済フォーム ───
  if (type === "payment-form") {
    const productName = getString("productName");
    const price = getString("price");
    const buttonText = getString("buttonText", "購入する");
    return (
      <section style={sectionStyle} className="py-10 px-4">
        <div className="mx-auto max-w-md rounded-2xl border bg-white p-8 shadow-lg">
          {productName && <h3 className="mb-2 text-xl font-bold">{productName}</h3>}
          {price && <p className="mb-6 text-3xl font-extrabold text-indigo-600">¥{price}</p>}
          <div className="space-y-4">
            <input type="text" placeholder="カード番号" className="w-full rounded-lg border px-4 py-3 font-mono outline-none focus:border-indigo-500" readOnly />
            <div className="flex gap-3">
              <input type="text" placeholder="MM/YY" className="w-1/2 rounded-lg border px-4 py-3 outline-none focus:border-indigo-500" readOnly />
              <input type="text" placeholder="CVC" className="w-1/2 rounded-lg border px-4 py-3 outline-none focus:border-indigo-500" readOnly />
            </div>
          </div>
          <button
            onClick={onConversion}
            style={{ backgroundColor: btnColor, color: btnText }}
            className="mt-6 w-full rounded-lg py-4 text-lg font-bold shadow hover:opacity-90 transition-opacity"
          >
            {buttonText}
          </button>
        </div>
      </section>
    );
  }

  // ─── 購入ボタン ───
  if (type === "purchase-button") {
    const text = getString("text", "今すぐ購入する");
    const price = getString("price");
    const url = getString("url", "#");
    const animation = getString("animation", "none");
    const animClass = animation === "pulse" ? "animate-pulse" : animation === "bounce" ? "animate-bounce" : "";
    return (
      <section style={sectionStyle} className="py-8 px-4 text-center">
        <a
          href={url}
          onClick={url === "#" ? (e) => { e.preventDefault(); void onConversion(); } : undefined}
          style={{ backgroundColor: bgColor !== "#ffffff" ? bgColor : btnColor, color: btnText }}
          className={`inline-block rounded-xl px-12 py-5 text-xl font-extrabold shadow-xl hover:opacity-90 transition-opacity ${animClass}`}
        >
          {price && <span className="mr-2 text-sm opacity-80">{price}</span>}
          {text}
        </a>
      </section>
    );
  }

  // ─── 商品一覧 ───
  if (type === "product-list") {
    const title = getString("title");
    const rawProducts = getString("products");
    const layout = getString("layout", "grid");
    const products = rawProducts.split("\n").filter(Boolean).map((p) => {
      const [name, price, url] = p.split("|");
      return { name: name ?? "", price: price ?? "", url: url ?? "#" };
    });
    return (
      <section style={sectionStyle} className="py-10 px-4">
        <div className="mx-auto max-w-5xl">
          {title && <h2 className="mb-6 text-center text-2xl font-bold">{title}</h2>}
          <div className={layout === "grid" ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4"}>
            {products.map((p, i) => (
              <a key={i} href={p.url} className="block rounded-xl border bg-white p-5 shadow hover:shadow-md transition-shadow text-center">
                <p className="mb-2 font-semibold text-gray-800">{p.name}</p>
                {p.price && <p className="text-xl font-extrabold text-indigo-600">¥{p.price}</p>}
              </a>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ─── プログレスバー ───
  if (type === "progress-bar") {
    const label = getString("label");
    const value = parseFloat(getString("value", "0"));
    const max = parseFloat(getString("max", "100"));
    const showPercentage = getString("showPercentage", "true") !== "false";
    const barColor = getString("barColor", "#4f46e5");
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    return (
      <section style={sectionStyle} className="py-6 px-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-1 flex items-center justify-between text-sm font-medium">
            {label && <span>{label}</span>}
            {showPercentage && <span>{Math.round(pct)}%</span>}
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
            <div style={{ width: `${pct}%`, backgroundColor: barColor }} className="h-full rounded-full transition-all" />
          </div>
        </div>
      </section>
    );
  }

  // ─── イベント申込フォーム ───
  if (type === "event-form") {
    const title = getString("title", "イベントに申し込む");
    const date = getString("date");
    const location = getString("location");
    const buttonText = getString("buttonText", "申し込む");
    return (
      <section style={sectionStyle} className="py-10 px-4">
        <div className="mx-auto max-w-md rounded-2xl border bg-white p-8 shadow-lg">
          <h3 className="mb-4 text-xl font-bold text-center">{title}</h3>
          {date && <p className="mb-1 text-sm text-gray-500">日程: {date}</p>}
          {location && <p className="mb-4 text-sm text-gray-500">場所: {location}</p>}
          <div className="space-y-3">
            <input type="text" placeholder="お名前" className="w-full rounded-lg border px-4 py-3 outline-none focus:border-indigo-500" readOnly />
            <input type="email" placeholder="メールアドレス" className="w-full rounded-lg border px-4 py-3 outline-none focus:border-indigo-500" readOnly />
          </div>
          <button
            onClick={onConversion}
            style={{ backgroundColor: btnColor, color: btnText }}
            className="mt-5 w-full rounded-lg py-4 font-bold shadow hover:opacity-90 transition-opacity"
          >
            {buttonText}
          </button>
        </div>
      </section>
    );
  }

  // ─── イベント日程一覧 ───
  if (type === "event-schedule") {
    const title = getString("title");
    const rawDates = getString("dates");
    const buttonText = getString("buttonText", "申し込む");
    const dates = rawDates.split("\n").filter(Boolean).map((d) => {
      const [datetime, place, seats] = d.split("|");
      return { datetime: datetime ?? "", place: place ?? "", seats: seats ?? "" };
    });
    return (
      <section style={sectionStyle} className="py-10 px-4">
        <div className="mx-auto max-w-3xl">
          {title && <h2 className="mb-6 text-2xl font-bold text-center">{title}</h2>}
          <div className="space-y-3">
            {dates.map((d, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm">
                <div>
                  <p className="font-semibold">{d.datetime}</p>
                  <p className="text-sm text-gray-500">{d.place}</p>
                </div>
                <div className="flex items-center gap-3">
                  {d.seats && <span className="text-sm text-gray-400">残{d.seats}席</span>}
                  <button
                    onClick={onConversion}
                    style={{ backgroundColor: btnColor, color: btnText }}
                    className="rounded-lg px-4 py-2 text-sm font-bold shadow hover:opacity-90 transition-opacity"
                  >
                    {buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ─── マルチカラム ───
  if (type === "multi-column") {
    const columns = parseInt(getString("columns", "2"), 10);
    const gap = getString("gap", "4");
    const rawItems = getString("items");
    const items = rawItems.split("||").filter(Boolean);
    return (
      <section style={sectionStyle} className="py-8 px-4">
        <div
          className="mx-auto max-w-6xl"
          style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: `${gap}px` }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border bg-white p-6 shadow-sm"
              dangerouslySetInnerHTML={{ __html: item.replace(/\n/g, "<br/>") }}
            />
          ))}
        </div>
      </section>
    );
  }

  // ─── タブ切替 ───
  if (type === "tab-switcher") {
    const rawTabs = getString("tabs");
    const activeColor = getString("activeColor", "#4f46e5");
    const inactiveColor = getString("inactiveColor", "#6b7280");
    const tabs = rawTabs.split("\n").filter(Boolean).map((t) => {
      const sep = t.indexOf("|");
      return { label: t.slice(0, sep), content: t.slice(sep + 1) };
    });
    return (
      <section style={sectionStyle} className="py-8 px-4">
        <div className="mx-auto max-w-4xl">
          <TabSwitcher tabs={tabs} activeColor={activeColor} inactiveColor={inactiveColor} />
        </div>
      </section>
    );
  }

  // ─── 通知バー ───
  if (type === "notification-bar") {
    const text = getString("text");
    const notifBg = getString("backgroundColor", "#fef3c7");
    const notifText = getString("textColor", "#92400e");
    const sticky = getString("sticky", "false") === "true";
    return (
      <div
        style={{ backgroundColor: notifBg, color: notifText }}
        className={`${sticky ? "sticky top-0 z-50" : ""} w-full px-4 py-3 text-center text-sm font-medium`}
      >
        {text}
      </div>
    );
  }

  // ─── プロフィールカード ───
  if (type === "profile-card") {
    const name = getString("name");
    const titleText = getString("title");
    const image = getString("image") || getString("imageUrl");
    const bio = getString("bio") || getString("description");
    const imageShape = getString("imageShape", "circle");
    const imgClass = imageShape === "square" ? "rounded-xl" : "rounded-full";
    return (
      <section style={sectionStyle} className="py-10 px-4">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          {image && <img src={image} alt={name} className={`h-32 w-32 object-cover shadow ${imgClass}`} />}
          {name && <h3 className="text-2xl font-bold">{name}</h3>}
          {titleText && <p className="text-gray-500">{titleText}</p>}
          {bio && <p className="text-base leading-relaxed text-gray-700">{bio}</p>}
        </div>
      </section>
    );
  }

  // ─── 実績バッジ ───
  if (type === "achievement-badge") {
    const rawItems = getString("items");
    const columns = parseInt(getString("columns", "3"), 10);
    const badgeColor = getString("badgeColor", "#4f46e5");
    const badgeTextColor = getString("textColor", "#ffffff");
    const items = rawItems.split("\n").filter(Boolean).map((it) => {
      const [value, label] = it.split("|");
      return { value: value ?? "", label: label ?? "" };
    });
    return (
      <section style={sectionStyle} className="py-10 px-4">
        <div
          className="mx-auto max-w-4xl"
          style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: "1rem" }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              style={{ backgroundColor: badgeColor, color: badgeTextColor }}
              className="flex flex-col items-center rounded-2xl p-6 shadow text-center"
            >
              <span className="text-3xl font-extrabold">{item.value}</span>
              <span className="mt-1 text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ─── 星評価 ───
  if (type === "rating-stars") {
    const rating = parseFloat(getString("rating", "5"));
    const maxRating = parseInt(getString("maxRating", "5"), 10);
    const reviewCount = getString("reviewCount");
    const starSize = getString("size", "md");
    const starColor = getString("color", "#f59e0b");
    const starClass = starSize === "lg" ? "text-4xl" : starSize === "sm" ? "text-lg" : "text-2xl";
    return (
      <section style={sectionStyle} className="py-6 px-4 text-center">
        <div className="mx-auto flex max-w-xs flex-col items-center gap-1">
          <div className={`flex gap-1 ${starClass}`} style={{ color: starColor }}>
            {Array.from({ length: maxRating }, (_, i) => (
              <span key={i}>{i < Math.round(rating) ? "★" : "☆"}</span>
            ))}
          </div>
          <p className="text-lg font-bold">{rating} / {maxRating}</p>
          {reviewCount && <p className="text-sm text-gray-400">{reviewCount}件のレビュー</p>}
        </div>
      </section>
    );
  }

  // ─── SNSシェア ───
  if (type === "sns-share") {
    const platforms = getString("platforms", "twitter,facebook,line");
    const text = getString("text", "");
    const shareStyle = getString("style", "button");
    const platformList = platforms.split(",").map((p) => p.trim());
    const shareLinks: Record<string, { label: string; color: string; url: string }> = {
      twitter: { label: "X (Twitter)", color: "#000000", url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}` },
      facebook: { label: "Facebook", color: "#1877f2", url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}` },
      line: { label: "LINE", color: "#06C755", url: `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}` },
    };
    return (
      <section style={sectionStyle} className="py-6 px-4">
        <div className="mx-auto flex max-w-lg flex-wrap justify-center gap-3">
          {platformList.map((p) => {
            const info = shareLinks[p];
            if (!info) return null;
            return (
              <a
                key={p}
                href={info.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ backgroundColor: info.color }}
                className={`rounded-lg px-5 py-2 text-sm font-semibold text-white shadow hover:opacity-90 transition-opacity ${shareStyle === "icon" ? "px-3" : ""}`}
              >
                {info.label}
              </a>
            );
          })}
        </div>
      </section>
    );
  }

  // ─── 比較表 ───
  if (type === "comparison-table") {
    const rawHeaders = getString("headers");
    const rawRows = getString("rows");
    const highlightColumn = parseInt(getString("highlightColumn", "0"), 10);
    const headers = rawHeaders.split("|");
    const rows = rawRows.split("\n").filter(Boolean).map((r) => r.split("|"));
    return (
      <section style={sectionStyle} className="py-8 px-4 overflow-x-auto">
        <div className="mx-auto max-w-5xl">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    className={`border px-4 py-3 font-bold text-center ${
                      i === highlightColumn ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="even:bg-gray-50">
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`border px-4 py-3 text-center ${ci === highlightColumn ? "bg-indigo-50 font-semibold" : ""}`}
                    >
                      {cell === "o" ? "✓" : cell === "x" ? "✗" : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  // ─── タイムライン ───
  if (type === "timeline") {
    const rawItems = getString("items");
    const lineColor = getString("lineColor", "#4f46e5");
    const items = rawItems.split("\n").filter(Boolean).map((it) => {
      const sep = it.indexOf("|");
      return { label: it.slice(0, sep), text: it.slice(sep + 1) };
    });
    return (
      <section style={sectionStyle} className="py-10 px-4">
        <div className="mx-auto max-w-2xl">
          {items.map((item, i) => (
            <div key={i} className="relative pl-8 pb-8 last:pb-0">
              <div
                style={{ backgroundColor: lineColor }}
                className="absolute left-2.5 top-0 h-full w-0.5 last:h-6"
              />
              <div
                style={{ backgroundColor: lineColor }}
                className="absolute left-0 top-1 h-5 w-5 rounded-full border-2 border-white shadow"
              />
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{item.label}</p>
              <p className="mt-1 text-base leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ─── アイコンリスト ───
  if (type === "icon-list") {
    const rawItems = getString("items");
    const iconColor = getString("iconColor", "#4f46e5");
    const fontSize = getString("fontSize", "text-base");
    const items = rawItems.split("\n").filter(Boolean).map((it) => {
      const sep = it.indexOf("|");
      return { icon: it.slice(0, sep), text: it.slice(sep + 1) };
    });
    return (
      <section style={sectionStyle} className="py-8 px-4">
        <ul className="mx-auto max-w-3xl space-y-3">
          {items.map((item, i) => (
            <li key={i} className={`flex items-start gap-3 ${fontSize}`}>
              <span style={{ color: iconColor }} className="flex-shrink-0 text-xl leading-snug">{item.icon}</span>
              <span className="leading-relaxed">{item.text}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  // ─── 画像ギャラリー ───
  if (type === "image-gallery") {
    const rawImages = getString("images");
    const columns = parseInt(getString("columns", "3"), 10);
    const gap = getString("gap", "4");
    const images = rawImages.split("\n").filter(Boolean).map((img) => {
      const [url, caption] = img.split("|");
      return { url: url ?? "", caption: caption ?? "" };
    });
    return (
      <section style={sectionStyle} className="py-8 px-4">
        <div
          className="mx-auto max-w-5xl"
          style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: `${gap}px` }}
        >
          {images.map((img, i) => (
            <figure key={i} className="overflow-hidden rounded-xl shadow">
              <img src={img.url} alt={img.caption} className="w-full object-cover" />
              {img.caption && <figcaption className="bg-white px-3 py-2 text-xs text-gray-500">{img.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </section>
    );
  }

  // ─── 価格表 ───
  if (type === "price-table") {
    const rawPlans = getString("plans");
    const recommended = getString("recommended", "");
    const plans = rawPlans.split("\n").filter(Boolean).map((p) => {
      const [name, price, features, url] = p.split("|");
      return { name: name ?? "", price: price ?? "", features: features ?? "", url: url ?? "#" };
    });
    return (
      <section style={sectionStyle} className="py-10 px-4">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, i) => {
            const isRec = plan.name === recommended;
            return (
              <div
                key={i}
                className={`flex flex-col rounded-2xl border p-6 shadow ${isRec ? "border-indigo-500 ring-2 ring-indigo-500" : "border-gray-200"}`}
              >
                {isRec && (
                  <span className="mb-3 inline-block rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white self-start">
                    おすすめ
                  </span>
                )}
                <h3 className="mb-2 text-xl font-bold">{plan.name}</h3>
                <p className="mb-4 text-3xl font-extrabold text-indigo-600">¥{plan.price}</p>
                <ul className="mb-6 flex-1 space-y-2 text-sm text-gray-600">
                  {plan.features.split(",").map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2"><span className="text-green-500">✓</span>{f}</li>
                  ))}
                </ul>
                <a
                  href={plan.url}
                  style={{ backgroundColor: isRec ? btnColor : "#6b7280", color: btnText }}
                  className="block rounded-lg py-3 text-center font-bold shadow hover:opacity-90 transition-opacity"
                >
                  選択する
                </a>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // ─── 固定CTA ───
  if (type === "floating-cta") {
    const text = getString("text", "今すぐ申し込む");
    const subText = getString("subText");
    const floatBg = getString("backgroundColor", "#4f46e5");
    const floatText = getString("textColor", "#ffffff");
    const url = getString("url", "#");
    const position = getString("position", "bottom");
    const posClass = position === "top" ? "top-0" : "bottom-0";
    return (
      <div
        style={{ backgroundColor: floatBg, color: floatText }}
        className={`fixed ${posClass} left-0 right-0 z-50 flex items-center justify-between px-6 py-3 shadow-2xl`}
      >
        <div>
          <p className="font-bold text-lg">{text}</p>
          {subText && <p className="text-xs opacity-80">{subText}</p>}
        </div>
        <a
          href={url}
          onClick={url === "#" ? (e) => { e.preventDefault(); void onConversion(); } : undefined}
          className="rounded-lg bg-white px-6 py-2 font-bold text-sm shadow hover:opacity-90 transition-opacity"
          style={{ color: floatBg }}
        >
          申し込む
        </a>
      </div>
    );
  }

  // ─── アンカーリンク ───
  if (type === "anchor-link") {
    const text = getString("text");
    const targetId = getString("targetId");
    const anchorTextColor = getString("textColor", "#4f46e5");
    const textAlign = getString("textAlign", "center");
    return (
      <section style={sectionStyle} className={`py-4 px-4 text-${textAlign}`}>
        <a
          href={targetId ? `#${targetId}` : "#"}
          style={{ color: anchorTextColor }}
          className="inline-block font-medium underline hover:opacity-75 transition-opacity"
        >
          {text}
        </a>
      </section>
    );
  }

  // ─── 地図埋め込み ───
  if (type === "map-embed") {
    const embedUrl = getString("embedUrl");
    const height = getString("height", "400px");
    const borderRadius = getString("borderRadius", "12px");
    if (!embedUrl) return null;
    return (
      <section style={sectionStyle} className="py-6 px-4">
        <div className="mx-auto max-w-4xl overflow-hidden shadow-lg" style={{ borderRadius }}>
          <iframe
            src={embedUrl}
            style={{ width: "100%", height, border: 0 }}
            allowFullScreen
            loading="lazy"
          />
        </div>
      </section>
    );
  }

  // ─── カルーセル ───
  if (type === "carousel-slider") {
    const rawSlides = getString("slides");
    const showDots = getString("showDots", "true") !== "false";
    const slides = rawSlides.split("\n").filter(Boolean).map((s) => {
      const [url, caption] = s.split("|");
      return { url: url ?? "", caption: caption ?? "" };
    });
    return (
      <section style={sectionStyle} className="py-8 px-4">
        <div className="mx-auto max-w-4xl">
          <CarouselSlider slides={slides} showDots={showDots} />
        </div>
      </section>
    );
  }

  // ─── インタラクティブ動画 ───
  if (type === "interactive-video") {
    const videoUrl = getString("videoUrl") || getString("src");
    const title = getString("title");
    const rawChoices = getString("choices");
    const choicePosition = getString("choicePosition", "bottom");
    const choiceStyle = getString("choiceStyle", "card");

    if (!videoUrl) return null;

    const isYoutube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
    const isVimeo = videoUrl.includes("vimeo.com");
    const embedUrl = isYoutube
      ? videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")
      : isVimeo
        ? videoUrl.replace("vimeo.com/", "player.vimeo.com/video/")
        : "";

    const choices = rawChoices
      .split("\n")
      .filter(Boolean)
      .map((c) => {
        const [label, url, seconds] = c.split("|");
        return { label: label ?? "", url: url ?? "#", seconds: parseInt(seconds ?? "0", 10) };
      });

    const choiceBtnClass =
      choiceStyle === "pill"
        ? "rounded-full px-6 py-2 text-sm"
        : choiceStyle === "button"
          ? "rounded-lg px-6 py-3 text-base"
          : "rounded-xl border bg-white p-4 shadow-sm hover:shadow-md text-left";

    return (
      <section style={sectionStyle} className="py-8 px-4">
        <div className="mx-auto max-w-4xl">
          {title && <h3 className="mb-4 text-xl font-bold text-center">{title}</h3>}
          <div className="relative">
            <div className="relative h-0 overflow-hidden rounded-xl pb-[56.25%] shadow-lg">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  className="absolute inset-0 h-full w-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : (
                <video src={videoUrl} controls className="absolute inset-0 h-full w-full object-cover" />
              )}
            </div>
            {choicePosition === "overlay" && choices.length > 0 && (
              <div className="absolute inset-0 flex items-end justify-center pb-8">
                <div className="flex flex-wrap gap-3 rounded-xl bg-black/50 p-4 backdrop-blur-sm">
                  {choices.map((choice, i) => (
                    <a
                      key={i}
                      href={choice.url}
                      className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 shadow hover:bg-gray-100 transition-colors"
                    >
                      {choice.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          {choicePosition === "bottom" && choices.length > 0 && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {choices.map((choice, i) => (
                <a
                  key={i}
                  href={choice.url}
                  style={choiceStyle !== "card" ? { backgroundColor: btnColor, color: btnText } : undefined}
                  className={`block text-center font-semibold transition-all hover:opacity-90 ${choiceBtnClass}`}
                >
                  {choice.label}
                  {choice.seconds > 0 && (
                    <span className="ml-2 text-xs opacity-60">
                      ({Math.floor(choice.seconds / 60)}:{String(choice.seconds % 60).padStart(2, "0")}〜)
                    </span>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  // ─── 時限表示CTA付き動画 ───
  if (type === "timed-video-cta") {
    const videoUrl = getString("videoUrl") || getString("src");
    const title = getString("title");
    const ctaText = getString("ctaText", "今すぐ申し込む");
    const ctaUrl = getString("ctaUrl") || getString("url");
    const ctaSubText = getString("ctaSubText");
    const delaySeconds = parseInt(getString("delaySeconds", "30"), 10);
    const triggerType = getString("triggerType", "elapsed");
    const hideAtSeconds = parseInt(getString("hideAtSeconds", "0"), 10);
    const ctaColorVal = getString("ctaColor", "#dc2626");
    const ctaTextColorVal = getString("ctaTextColor", "#ffffff");
    const animation = getString("animation", "fadeIn");

    if (!videoUrl) return null;

    const isYoutube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
    const isVimeo = videoUrl.includes("vimeo.com");
    const embedUrl = isYoutube
      ? videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")
      : isVimeo
        ? videoUrl.replace("vimeo.com/", "player.vimeo.com/video/")
        : "";

    return (
      <section style={sectionStyle} className="py-8 px-4">
        <div className="mx-auto max-w-4xl">
          {title && <h3 className="mb-4 text-xl font-bold text-center">{title}</h3>}
          <div className="relative w-full overflow-hidden rounded-xl shadow-lg bg-black" style={{ paddingBottom: "56.25%" }}>
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="absolute top-0 left-0 w-full h-full"
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title={title || "Video"}
              />
            ) : (
              <video
                src={videoUrl}
                controls
                className="absolute top-0 left-0 w-full h-full object-cover"
                data-trigger-type={triggerType}
              />
            )}
          </div>
          <TimedCTAButton
            ctaText={ctaText}
            ctaUrl={ctaUrl}
            ctaSubText={ctaSubText}
            delaySeconds={delaySeconds}
            triggerType={triggerType}
            hideAtSeconds={hideAtSeconds}
            ctaColor={ctaColorVal}
            ctaTextColor={ctaTextColorVal}
            animation={animation}
            onConversion={onConversion}
          />
        </div>
      </section>
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

// ─────────────────────────────────────────────────────────────────────────────
// タブ切替コンポーネント
// ─────────────────────────────────────────────────────────────────────────────
function TabSwitcher({
  tabs,
  activeColor,
  inactiveColor,
}: {
  tabs: { label: string; content: string }[];
  activeColor: string;
  inactiveColor: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (tabs.length === 0) return null;

  return (
    <div>
      <div className="flex overflow-x-auto border-b">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            style={{ color: i === activeIndex ? activeColor : inactiveColor, borderBottomColor: i === activeIndex ? activeColor : "transparent" }}
            className="flex-shrink-0 border-b-2 px-5 py-3 text-sm font-semibold transition-colors"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        className="py-6 text-base leading-relaxed"
        dangerouslySetInnerHTML={{ __html: (tabs[activeIndex]?.content ?? "").replace(/\n/g, "<br/>") }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// カルーセルスライダー
// ─────────────────────────────────────────────────────────────────────────────
function CarouselSlider({
  slides,
  showDots,
}: {
  slides: { url: string; caption: string }[];
  showDots: boolean;
}) {
  const [current, setCurrent] = useState(0);

  if (slides.length === 0) return null;

  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);
  const next = () => setCurrent((c) => (c + 1) % slides.length);

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="relative">
        <img
          src={slides[current]?.url}
          alt={slides[current]?.caption}
          className="h-64 w-full object-cover md:h-96"
        />
        {slides[current]?.caption && (
          <p className="absolute bottom-0 left-0 right-0 bg-black/50 px-4 py-2 text-sm text-white text-center">
            {slides[current].caption}
          </p>
        )}
      </div>
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
            aria-label="前へ"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
            aria-label="次へ"
          >
            ›
          </button>
        </>
      )}
      {showDots && slides.length > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 w-2 rounded-full transition-colors ${i === current ? "bg-indigo-600" : "bg-gray-300"}`}
              aria-label={`スライド ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 時限表示CTAボタン（動画視聴後にボタン表示）
// ─────────────────────────────────────────────────────────────────────────────
function TimedCTAButton({
  ctaText,
  ctaUrl,
  ctaSubText,
  delaySeconds,
  triggerType,
  hideAtSeconds,
  ctaColor,
  ctaTextColor,
  animation,
  onConversion,
}: {
  ctaText: string;
  ctaUrl: string;
  ctaSubText: string;
  delaySeconds: number;
  triggerType: string;
  hideAtSeconds: number;
  ctaColor: string;
  ctaTextColor: string;
  animation: string;
  onConversion: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (triggerType === "elapsed") {
      timerRef.current = setTimeout(() => {
        setVisible(true);
        requestAnimationFrame(() => setEntered(true));
      }, delaySeconds * 1000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [triggerType, delaySeconds]);

  // 非表示タイマー
  useEffect(() => {
    if (!visible || hideAtSeconds <= 0) return;
    const hideTimer = setTimeout(() => {
      setEntered(false);
      setTimeout(() => setVisible(false), 500);
    }, hideAtSeconds * 1000);
    return () => clearTimeout(hideTimer);
  }, [visible, hideAtSeconds]);

  if (!visible) return null;

  const animClass =
    animation === "fadeIn"
      ? `transition-opacity duration-700 ${entered ? "opacity-100" : "opacity-0"}`
      : animation === "slideUp"
        ? `transition-all duration-700 ${entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`
        : animation === "zoom"
          ? `transition-all duration-500 ${entered ? "opacity-100 scale-100" : "opacity-0 scale-75"}`
          : animation === "shake"
            ? `${entered ? "animate-pulse" : "opacity-0"}`
            : "";

  const handleClick = (e: React.MouseEvent) => {
    if (!ctaUrl || ctaUrl === "#") {
      e.preventDefault();
      onConversion();
    }
  };

  return (
    <div className={`mt-6 text-center ${animClass}`}>
      <a
        href={ctaUrl || "#"}
        onClick={handleClick}
        style={{ backgroundColor: ctaColor, color: ctaTextColor }}
        className="inline-block rounded-xl px-10 py-4 text-xl font-extrabold shadow-xl hover:opacity-90 transition-opacity"
      >
        {ctaText}
      </a>
      {ctaSubText && (
        <p className="mt-2 text-sm text-gray-500">{ctaSubText}</p>
      )}
    </div>
  );
}
