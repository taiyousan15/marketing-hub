"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Upload,
  Link,
  Sparkles,
  X,
  Loader2,
  Image as ImageIcon,
  Video,
  FileText,
} from "lucide-react";
import type { MessageContent, MediaItem } from "@/types/campaign";
import { IMAGE_MODELS, VIDEO_MODELS } from "@/lib/ai-media/models";

interface StepEditorMessageProps {
  content: MessageContent;
  subject?: string;
  isLine: boolean;
  onContentChange: (updates: Partial<MessageContent>) => void;
  onSubjectChange: (subject: string) => void;
}

const MAX_TEXTS = 5;

export function StepEditorMessage({
  content,
  subject,
  isLine,
  onContentChange,
  onSubjectChange,
}: StepEditorMessageProps) {
  const [activeTab, setActiveTab] = useState(
    content.type === "video"
      ? "video"
      : content.type === "image"
        ? "image"
        : content.type === "flex"
          ? "flex"
          : "text"
  );

  const [imageInput, setImageInput] = useState("");
  const [videoInput, setVideoInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Image AI generation state
  const [imageModelId, setImageModelId] = useState(IMAGE_MODELS[0].id);
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageAspectRatio, setImageAspectRatio] = useState("1:1");

  // Video AI generation state
  const [videoModelId, setVideoModelId] = useState(VIDEO_MODELS[0].id);
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoDuration, setVideoDuration] = useState(5);
  const [videoResolution, setVideoResolution] = useState("720p");

  // Derived state
  const texts = content.texts ?? (content.text ? [content.text] : [""]);
  const images =
    content.images ??
    (content.imageUrl ? [{ url: content.imageUrl, source: "url" as const }] : []);
  const video =
    content.video ??
    (content.videoUrl ? { url: content.videoUrl, source: "url" as const } : undefined);

  const selectedImageModel = IMAGE_MODELS.find((m) => m.id === imageModelId);
  const selectedVideoModel = VIDEO_MODELS.find((m) => m.id === videoModelId);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    onContentChange({ type: tab as MessageContent["type"] });
  };

  // ─── Text handlers ───────────────────────────────────────────────
  const addText = () => {
    if (texts.length >= MAX_TEXTS) return;
    const newTexts = [...texts, ""];
    onContentChange({ texts: newTexts, text: newTexts[0], type: "text" });
  };

  const updateText = (index: number, value: string) => {
    const newTexts = texts.map((t, i) => (i === index ? value : t));
    onContentChange({ texts: newTexts, text: newTexts[0], type: "text" });
  };

  const removeText = (index: number) => {
    if (texts.length <= 1) return;
    const newTexts = texts.filter((_, i) => i !== index);
    onContentChange({ texts: newTexts, text: newTexts[0], type: "text" });
  };

  // ─── Image handlers ───────────────────────────────────────────────
  const addImageByUrl = () => {
    const trimmed = imageInput.trim();
    if (!trimmed) return;
    const item: MediaItem = { url: trimmed, source: "url" };
    const newImages = [...images, item];
    onContentChange({ images: newImages, imageUrl: newImages[0].url, type: "image" });
    setImageInput("");
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onContentChange({
      images: newImages,
      imageUrl: newImages[0]?.url,
      type: "image",
    });
  };

  const onImageDrop = useCallback(
    (files: File[]) => {
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          const item: MediaItem = { url, source: "upload", mimeType: file.type, name: file.name };
          onContentChange({
            images: [...images, item],
            imageUrl: images.length === 0 ? url : images[0].url,
            type: "image",
          });
        };
        reader.readAsDataURL(file);
      });
    },
    [images, onContentChange]
  );

  const {
    getRootProps: getImageRootProps,
    getInputProps: getImageInputProps,
    isDragActive: isImageDragActive,
  } = useDropzone({
    onDrop: onImageDrop,
    accept: { "image/*": [] },
    maxSize: 10 * 1024 * 1024,
    multiple: true,
  });

  // ─── Video handlers ───────────────────────────────────────────────
  const setVideoByUrl = () => {
    const trimmed = videoInput.trim();
    if (!trimmed) return;
    const item: MediaItem = { url: trimmed, source: "url" };
    onContentChange({ video: item, videoUrl: trimmed, type: "video" });
    setVideoInput("");
  };

  const onVideoDrop = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const item: MediaItem = { url, source: "upload", mimeType: file.type, name: file.name };
        onContentChange({ video: item, videoUrl: url, type: "video" });
      };
      reader.readAsDataURL(file);
    },
    [onContentChange]
  );

  const {
    getRootProps: getVideoRootProps,
    getInputProps: getVideoInputProps,
    isDragActive: isVideoDragActive,
  } = useDropzone({
    onDrop: onVideoDrop,
    accept: { "video/*": [] },
    maxSize: 100 * 1024 * 1024,
    multiple: false,
  });

  // ─── AI generation ────────────────────────────────────────────────
  const generateImage = async () => {
    if (!imagePrompt.trim()) return;
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt,
          modelId: imageModelId,
          aspectRatio: imageAspectRatio,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "生成に失敗しました");
      const item: MediaItem = { url: data.imageUrl, source: "ai", model: data.model, prompt: imagePrompt };
      const newImages = [...images, item];
      onContentChange({ images: newImages, imageUrl: newImages[0].url, type: "image" });
      setImagePrompt("");
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "生成に失敗しました");
    } finally {
      setGenerating(false);
    }
  };

  const generateVideo = async () => {
    if (!videoPrompt.trim()) return;
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/ai/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: videoPrompt,
          modelId: videoModelId,
          duration: videoDuration,
          resolution: videoResolution,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "生成に失敗しました");
      const item: MediaItem = { url: data.videoUrl, source: "ai", model: data.model, prompt: videoPrompt };
      onContentChange({ video: item, videoUrl: data.videoUrl, type: "video" });
      setVideoPrompt("");
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "生成に失敗しました");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="text" className="gap-1">
          <FileText className="h-3.5 w-3.5" />
          テキスト
        </TabsTrigger>
        <TabsTrigger value="flex">Flex</TabsTrigger>
        <TabsTrigger value="image" className="gap-1">
          <ImageIcon className="h-3.5 w-3.5" />
          画像
        </TabsTrigger>
        <TabsTrigger value="video" className="gap-1">
          <Video className="h-3.5 w-3.5" />
          動画
        </TabsTrigger>
      </TabsList>

      {/* ─── テキスト tab ─────────────────────────────────────────── */}
      <TabsContent value="text" className="space-y-3 mt-4">
        {!isLine && (
          <div>
            <Label>件名</Label>
            <Input
              value={subject ?? ""}
              onChange={(e) => onSubjectChange(e.target.value)}
              placeholder="メールの件名"
            />
          </div>
        )}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>
              メッセージ本文{" "}
              <span className="text-xs text-muted-foreground font-normal">
                ({texts.length}/{MAX_TEXTS})
              </span>
            </Label>
            {texts.length < MAX_TEXTS && (
              <Button type="button" variant="outline" size="sm" onClick={addText}>
                <Plus className="h-3 w-3 mr-1" />
                テキスト追加
              </Button>
            )}
          </div>
          {texts.map((text, index) => (
            <div key={index} className="flex items-start gap-2">
              {texts.length > 1 && (
                <span className="text-xs text-muted-foreground pt-3 w-4 flex-shrink-0 text-center">
                  {index + 1}
                </span>
              )}
              <Textarea
                className="flex-1"
                rows={4}
                value={text}
                onChange={(e) => updateText(index, e.target.value)}
                placeholder={index === 0 ? "メッセージ本文を入力..." : `テキスト ${index + 1}...`}
              />
              {texts.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 mt-1 h-8 w-8 text-muted-foreground hover:text-red-500"
                  onClick={() => removeText(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <p className="text-xs text-muted-foreground">{"{name}"}などの変数を使用できます</p>
        </div>
      </TabsContent>

      {/* ─── Flex tab ─────────────────────────────────────────────── */}
      <TabsContent value="flex" className="space-y-3 mt-4">
        <div>
          <Label>代替テキスト</Label>
          <Input
            value={content.altText ?? ""}
            onChange={(e) => onContentChange({ altText: e.target.value })}
            placeholder="通知に表示されるテキスト"
          />
        </div>
        <div>
          <Label>Flexメッセージ（JSON）</Label>
          <Textarea
            rows={10}
            value={JSON.stringify(content.contents ?? {}, null, 2)}
            onChange={(e) => {
              try {
                const contents = JSON.parse(e.target.value);
                onContentChange({ contents });
              } catch {
                // ignore parse error while typing
              }
            }}
            placeholder="Flex Message JSON..."
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            LINE Flex Message Simulatorで作成したJSONを貼り付けてください
          </p>
        </div>
      </TabsContent>

      {/* ─── 画像 tab ─────────────────────────────────────────────── */}
      <TabsContent value="image" className="space-y-4 mt-4">
        {/* Dropzone */}
        <div
          {...getImageRootProps()}
          className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
            isImageDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/30 hover:border-primary/50"
          }`}
        >
          <input {...getImageInputProps()} />
          <Upload className="mx-auto h-7 w-7 text-muted-foreground mb-1.5" />
          <p className="text-sm text-muted-foreground">
            {isImageDragActive ? "ドロップして追加" : "画像をドラッグ&ドロップ または クリックして選択"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, GIF, WebP（最大10MB・複数選択可）</p>
        </div>

        {/* URL input */}
        <div className="flex gap-2">
          <Input
            value={imageInput}
            onChange={(e) => setImageInput(e.target.value)}
            placeholder="https://... （画像URL）"
            onKeyDown={(e) => e.key === "Enter" && addImageByUrl()}
          />
          <Button type="button" variant="outline" size="icon" onClick={addImageByUrl}>
            <Link className="h-4 w-4" />
          </Button>
        </div>

        {/* Image grid */}
        {images.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              選択中の画像（{images.length}枚）
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, index) => (
                <div key={index} className="relative group rounded-lg overflow-hidden border bg-muted">
                  {img.url.startsWith("data:image") || img.url.startsWith("http") ? (
                    <img
                      src={img.url}
                      alt={img.name ?? `画像 ${index + 1}`}
                      className="w-full h-24 object-cover"
                    />
                  ) : (
                    <div className="w-full h-24 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Badge className="absolute top-1 left-1 text-[10px] px-1" variant="secondary">
                    {img.source === "ai" ? "AI" : img.source === "upload" ? "UP" : "URL"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* AI image generation */}
        <div className="space-y-3">
          <Label className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            AIで画像を生成
          </Label>
          <Select value={imageModelId} onValueChange={setImageModelId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IMAGE_MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <span className="font-medium">{m.name}</span>
                  {m.pricePerImage && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ≈${m.pricePerImage}/枚
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedImageModel && (
            <p className="text-xs text-muted-foreground -mt-1">{selectedImageModel.description}</p>
          )}
          <div className="flex gap-2">
            <Label className="text-xs text-muted-foreground self-center w-16 flex-shrink-0">
              アスペクト比
            </Label>
            <Select value={imageAspectRatio} onValueChange={setImageAspectRatio}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(selectedImageModel?.aspectRatios ?? ["1:1"]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            rows={2}
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            placeholder="生成したい画像の説明（例：青空の下に立つビジネスパーソン）"
          />
          {genError && activeTab === "image" && (
            <p className="text-xs text-red-500">{genError}</p>
          )}
          <Button
            type="button"
            onClick={generateImage}
            disabled={generating || !imagePrompt.trim()}
            className="w-full"
            variant="outline"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                画像を生成
              </>
            )}
          </Button>
        </div>
      </TabsContent>

      {/* ─── 動画 tab ─────────────────────────────────────────────── */}
      <TabsContent value="video" className="space-y-4 mt-4">
        {/* Dropzone */}
        <div
          {...getVideoRootProps()}
          className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
            isVideoDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/30 hover:border-primary/50"
          }`}
        >
          <input {...getVideoInputProps()} />
          <Video className="mx-auto h-7 w-7 text-muted-foreground mb-1.5" />
          <p className="text-sm text-muted-foreground">
            {isVideoDragActive ? "ドロップして追加" : "動画をドラッグ&ドロップ または クリックして選択"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">MP4, WebM, MOV（最大100MB）</p>
        </div>

        {/* URL input */}
        <div className="flex gap-2">
          <Input
            value={videoInput}
            onChange={(e) => setVideoInput(e.target.value)}
            placeholder="https://... （動画URL）"
            onKeyDown={(e) => e.key === "Enter" && setVideoByUrl()}
          />
          <Button type="button" variant="outline" size="icon" onClick={setVideoByUrl}>
            <Link className="h-4 w-4" />
          </Button>
        </div>

        {/* Video settings */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">解像度</Label>
            <Select
              value={content.videoResolution ?? "720p"}
              onValueChange={(v) =>
                onContentChange({ videoResolution: v as MessageContent["videoResolution"] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="480p">480p (SD)</SelectItem>
                <SelectItem value="720p">720p (HD)</SelectItem>
                <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                <SelectItem value="4k">4K (UHD)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">フォーマット</Label>
            <Select
              value={content.videoFormat ?? "mp4"}
              onValueChange={(v) =>
                onContentChange({ videoFormat: v as MessageContent["videoFormat"] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mp4">MP4</SelectItem>
                <SelectItem value="webm">WebM</SelectItem>
                <SelectItem value="mov">MOV (QuickTime)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Video preview */}
        {video && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">選択中の動画</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 h-7 text-xs"
                onClick={() => onContentChange({ video: undefined, videoUrl: undefined })}
              >
                <X className="h-3 w-3 mr-1" />
                削除
              </Button>
            </div>
            <div className="rounded-lg border overflow-hidden bg-black/5">
              {video.url.startsWith("data:video") ? (
                <video src={video.url} controls className="w-full max-h-40" />
              ) : (
                <div className="flex items-center gap-2 p-3">
                  <Video className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground truncate">{video.url}</span>
                  <Badge variant="secondary" className="ml-auto flex-shrink-0 text-xs">
                    {video.source === "ai" ? "AI生成" : video.source === "upload" ? "アップロード" : "URL"}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* AI video generation */}
        <div className="space-y-3">
          <Label className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            AIで動画を生成
          </Label>
          <Select value={videoModelId} onValueChange={setVideoModelId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VIDEO_MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <span className="font-medium">{m.name}</span>
                  {m.pricePerSecond && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ≈${m.pricePerSecond}/秒
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedVideoModel && (
            <p className="text-xs text-muted-foreground -mt-1">{selectedVideoModel.description}</p>
          )}

          <div className="flex gap-2 items-center">
            <Label className="text-xs text-muted-foreground w-8 flex-shrink-0">長さ</Label>
            <Select
              value={videoDuration.toString()}
              onValueChange={(v) => setVideoDuration(parseInt(v))}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[3, 5, 8, 10, 15]
                  .filter((d) => d <= (selectedVideoModel?.maxDuration ?? 10))
                  .map((d) => (
                    <SelectItem key={d} value={d.toString()}>
                      {d}秒
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select value={videoResolution} onValueChange={setVideoResolution}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(selectedVideoModel?.resolutions ?? ["720p"]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Textarea
            rows={2}
            value={videoPrompt}
            onChange={(e) => setVideoPrompt(e.target.value)}
            placeholder="生成したい動画の説明（例：桜が舞う公園を歩くビジネスパーソン）"
          />
          {genError && activeTab === "video" && (
            <p className="text-xs text-red-500">{genError}</p>
          )}
          <Button
            type="button"
            onClick={generateVideo}
            disabled={generating || !videoPrompt.trim()}
            className="w-full"
            variant="outline"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                生成中（数分かかることがあります）...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                動画を生成
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            ※ AI動画生成には FAL_API_KEY の設定が必要です
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
