'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface FlexButton {
  label: string;
  action: string;
  url: string;
}

interface FlexMessageEditorProps {
  value?: Record<string, unknown>;
  onChange?: (value: Record<string, unknown>) => void;
}

export function FlexMessageEditor({ value, onChange }: FlexMessageEditorProps) {
  const [heroImageUrl, setHeroImageUrl] = useState((value?.hero as { url?: string })?.url ?? '');
  const [title, setTitle] = useState((value?.body as { contents?: Array<{ text?: string }> })?.contents?.[0]?.text ?? '');
  const [body, setBody] = useState((value?.body as { contents?: Array<unknown> })?.contents?.[1]
    ? ((value?.body as { contents: Array<{ text?: string }> }).contents[1].text ?? '') : '');
  const [buttons, setButtons] = useState<FlexButton[]>(
    (value?.footer as { contents?: Array<{ action?: { label?: string; uri?: string } }> })?.contents?.map((b) => ({
      label: b.action?.label ?? '',
      action: 'uri',
      url: b.action?.uri ?? '',
    })) ?? [{ label: 'ボタン', action: 'uri', url: '' }]
  );
  const [copied, setCopied] = useState(false);

  const buildFlexMessage = () => ({
    type: 'bubble',
    ...(heroImageUrl ? {
      hero: {
        type: 'image',
        url: heroImageUrl,
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover',
      }
    } : {}),
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        ...(title ? [{
          type: 'text',
          text: title,
          weight: 'bold',
          size: 'xl',
          wrap: true,
        }] : []),
        ...(body ? [{
          type: 'text',
          text: body,
          size: 'sm',
          color: '#555555',
          wrap: true,
        }] : []),
      ],
    },
    ...(buttons.length > 0 ? {
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: buttons.map((btn) => ({
          type: 'button',
          style: 'primary',
          action: {
            type: btn.action,
            label: btn.label,
            uri: btn.url,
          },
        })),
      }
    } : {}),
  });

  const handleChange = () => {
    const flex = buildFlexMessage();
    onChange?.(flex);
  };

  const handleCopyJson = async () => {
    const json = JSON.stringify(buildFlexMessage(), null, 2);
    await navigator.clipboard.writeText(json);
    setCopied(true);
    toast.success('JSONをコピーしました');
    setTimeout(() => setCopied(false), 2000);
  };

  const addButton = () => {
    if (buttons.length >= 4) {
      toast.error('ボタンは最大4個まで追加できます');
      return;
    }
    setButtons((prev) => [...prev, { label: 'ボタン', action: 'uri', url: '' }]);
  };

  const removeButton = (index: number) => {
    setButtons((prev) => prev.filter((_, i) => i !== index));
  };

  const updateButton = (index: number, field: keyof FlexButton, value: string) => {
    setButtons((prev) =>
      prev.map((btn, i) => (i === index ? { ...btn, [field]: value } : btn))
    );
  };

  const flex = buildFlexMessage();

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* エディタ */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm">ヒーロー画像URL</Label>
          <Input
            placeholder="https://example.com/image.jpg"
            value={heroImageUrl}
            onChange={(e) => { setHeroImageUrl(e.target.value); handleChange(); }}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm">タイトル</Label>
          <Input
            placeholder="メッセージのタイトル"
            value={title}
            onChange={(e) => { setTitle(e.target.value); handleChange(); }}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm">本文</Label>
          <Textarea
            placeholder="メッセージの本文を入力..."
            value={body}
            onChange={(e) => { setBody(e.target.value); handleChange(); }}
            rows={3}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">ボタン ({buttons.length}/4)</Label>
            <Button variant="outline" size="sm" onClick={addButton}>
              <Plus className="h-3 w-3 mr-1" />
              追加
            </Button>
          </div>

          {buttons.map((btn, index) => (
            <div key={index} className="space-y-2 p-3 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">ボタン {index + 1}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeButton(index)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
              <Input
                placeholder="ボタンラベル"
                value={btn.label}
                onChange={(e) => updateButton(index, 'label', e.target.value)}
                className="h-8 text-sm"
              />
              <Input
                placeholder="URL"
                value={btn.url}
                onChange={(e) => updateButton(index, 'url', e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* プレビュー */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">プレビュー</Label>
          <Button variant="outline" size="sm" onClick={handleCopyJson}>
            {copied ? <Check className="h-3.5 w-3.5 mr-1 text-green-500" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
            JSONコピー
          </Button>
        </div>

        {/* スマホモックアップ */}
        <div className="mx-auto w-[260px]">
          <div className="border-[8px] border-gray-800 rounded-[28px] overflow-hidden bg-gray-100 shadow-xl">
            <div className="bg-gray-800 h-6 flex items-center justify-center">
              <div className="w-16 h-1.5 bg-gray-600 rounded-full" />
            </div>
            <div className="bg-[#06c755] p-2 min-h-[400px]">
              <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                {heroImageUrl && (
                  <div className="aspect-[20/13] bg-gray-200 overflow-hidden">
                    <img
                      src={heroImageUrl}
                      alt="hero"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
                <div className="p-3 space-y-1">
                  {title && <p className="font-bold text-sm">{title}</p>}
                  {body && <p className="text-xs text-gray-500">{body}</p>}
                </div>
                {buttons.length > 0 && (
                  <div className="px-3 pb-3 space-y-1.5 border-t pt-2">
                    {buttons.map((btn, i) => (
                      <div key={i} className="bg-[#06c755] text-white text-xs text-center py-1.5 rounded-md font-medium">
                        {btn.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
