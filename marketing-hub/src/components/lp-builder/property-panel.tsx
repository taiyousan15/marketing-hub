'use client';

/**
 * LP Builder プロパティパネル
 * 選択されたコンポーネントのプロパティを編集
 */

import { useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Palette, Info, X } from 'lucide-react';
import { ComponentInstance, ComponentProperty } from './types';
import { getComponentByType } from './components-registry';
import { ImageUploader } from './image-uploader';

interface PropertyPanelProps {
  component: ComponentInstance | null;
  onPropertyChange: (componentId: string, key: string, value: string | number | boolean) => void;
  onClose: () => void;
  aiAssistEnabled?: boolean;
  onAiGenerateImage?: (prompt: string) => Promise<string | null>;
}

/**
 * プロパティ入力フィールド
 */
function PropertyField({
  property,
  value,
  onChange,
  aiAssistEnabled = false,
  onAiGenerateImage,
}: {
  property: ComponentProperty;
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
  aiAssistEnabled?: boolean;
  onAiGenerateImage?: (prompt: string) => Promise<string | null>;
}) {
  switch (property.type) {
    case 'text':
      return (
        <div className="space-y-2">
          <Label htmlFor={property.key}>{property.label}</Label>
          <Input
            id={property.key}
            type="text"
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            placeholder={property.placeholder}
          />
        </div>
      );

    case 'textarea':
      return (
        <div className="space-y-2">
          <Label htmlFor={property.key}>{property.label}</Label>
          <Textarea
            id={property.key}
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            placeholder={property.placeholder}
            rows={4}
          />
          <p className="text-xs text-gray-500">
            改行で複数項目を区切ることができます
          </p>
        </div>
      );

    case 'number':
      return (
        <div className="space-y-2">
          <Label htmlFor={property.key}>{property.label}</Label>
          <div className="flex items-center gap-4">
            <Slider
              id={property.key}
              min={0}
              max={100}
              step={1}
              value={[Number(value)]}
              onValueChange={(values) => onChange(values[0])}
              className="flex-1"
            />
            <Input
              type="number"
              value={Number(value)}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-20"
            />
          </div>
        </div>
      );

    case 'boolean':
      return (
        <div className="flex items-center justify-between">
          <Label htmlFor={property.key}>{property.label}</Label>
          <Switch
            id={property.key}
            checked={Boolean(value)}
            onCheckedChange={onChange}
          />
        </div>
      );

    case 'color':
      return (
        <div className="space-y-2">
          <Label htmlFor={property.key}>{property.label}</Label>
          <div className="flex items-center gap-2">
            <Input
              id={property.key}
              type="color"
              value={String(value)}
              onChange={(e) => onChange(e.target.value)}
              className="h-10 w-20 cursor-pointer"
            />
            <Input
              type="text"
              value={String(value)}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        </div>
      );

    case 'image':
      return (
        <ImageUploader
          value={String(value)}
          onChange={(url) => onChange(url)}
          label={property.label}
          aiAssistEnabled={aiAssistEnabled}
          onAiGenerate={onAiGenerateImage}
        />
      );

    case 'select':
      return (
        <div className="space-y-2">
          <Label htmlFor={property.key}>{property.label}</Label>
          <Select value={String(value)} onValueChange={onChange}>
            <SelectTrigger id={property.key}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {property.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    default:
      return null;
  }
}

/**
 * プロパティパネルメインコンポーネント
 */
export function PropertyPanel({ component, onPropertyChange, onClose, aiAssistEnabled = false, onAiGenerateImage }: PropertyPanelProps) {
  // Debug: Check if aiAssistEnabled is being received correctly
  console.log('PropertyPanel aiAssistEnabled:', aiAssistEnabled);

  const componentDef = component ? getComponentByType(component.componentType) : null;

  const handleChange = useCallback(
    (key: string, value: string | number | boolean) => {
      if (component) {
        onPropertyChange(component.id, key, value);
      }
    },
    [component, onPropertyChange]
  );

  if (!component || !componentDef) {
    return (
      <div className="flex h-full flex-col border-l border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900">プロパティ</h2>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <Settings className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              コンポーネントを選択
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              キャンバスのコンポーネントをクリックして
              <br />
              プロパティを編集できます
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col border-l border-gray-200 bg-white">
      {/* パネルヘッダー */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">プロパティ</h2>
            <p className="mt-1 text-sm text-gray-500">{componentDef.name}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* タブコンテンツ */}
      <Tabs defaultValue="properties" className="flex flex-1 flex-col">
        <div className="border-b border-gray-200 px-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="properties">
              <Settings className="mr-2 h-4 w-4" />
              設定
            </TabsTrigger>
            <TabsTrigger value="style">
              <Palette className="mr-2 h-4 w-4" />
              スタイル
            </TabsTrigger>
            <TabsTrigger value="info">
              <Info className="mr-2 h-4 w-4" />
              情報
            </TabsTrigger>
          </TabsList>
        </div>

        {/* プロパティタブ */}
        <TabsContent value="properties" className="mt-0 flex-1">
          <ScrollArea className="h-full">
            <div className="space-y-6 p-6">
              <div>
                <h3 className="mb-4 text-sm font-semibold text-gray-900">
                  コンポーネント設定
                </h3>
                <div className="space-y-4">
                  {componentDef.defaultProps.map((prop) => (
                    <PropertyField
                      key={prop.key}
                      property={prop}
                      value={component.props[prop.key] ?? prop.value}
                      onChange={(value) => handleChange(prop.key, value)}
                      aiAssistEnabled={aiAssistEnabled}
                      onAiGenerateImage={onAiGenerateImage}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">
                  コンポーネント情報
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">タイプ:</span>
                    <span className="font-medium">{componentDef.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">カテゴリ:</span>
                    <span className="font-medium">{componentDef.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">ID:</span>
                    <span className="font-mono text-xs">{component.id}</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* スタイルタブ */}
        <TabsContent value="style" className="mt-0 flex-1">
          <ScrollArea className="h-full">
            <div className="space-y-6 p-6">
              <div>
                <h3 className="mb-4 text-sm font-semibold text-gray-900">
                  カスタムスタイル
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>余白 (Padding)</Label>
                    <Input type="text" placeholder="例: 20px" />
                  </div>
                  <div className="space-y-2">
                    <Label>マージン (Margin)</Label>
                    <Input type="text" placeholder="例: 10px 0" />
                  </div>
                  <div className="space-y-2">
                    <Label>カスタムCSS</Label>
                    <Textarea
                      placeholder="カスタムCSSクラス名を入力"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* 情報タブ */}
        <TabsContent value="info" className="mt-0 flex-1">
          <ScrollArea className="h-full">
            <div className="space-y-6 p-6">
              <div>
                <h3 className="mb-4 text-sm font-semibold text-gray-900">
                  コンポーネント説明
                </h3>
                <Card className="bg-blue-50 p-4">
                  <p className="text-sm text-blue-900">{componentDef.description}</p>
                </Card>
              </div>

              <Separator />

              <div>
                <h3 className="mb-4 text-sm font-semibold text-gray-900">
                  使用方法
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    1. 左パネルからコンポーネントを選択
                  </p>
                  <p>
                    2. キャンバスにドラッグ&ドロップ
                  </p>
                  <p>
                    3. このパネルでプロパティを編集
                  </p>
                  <p>
                    4. プレビューで確認
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="mb-4 text-sm font-semibold text-gray-900">
                  ショートカット
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">削除:</span>
                    <kbd className="rounded bg-gray-100 px-2 py-1 font-mono text-xs">
                      Delete
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">複製:</span>
                    <kbd className="rounded bg-gray-100 px-2 py-1 font-mono text-xs">
                      Ctrl+D
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">元に戻す:</span>
                    <kbd className="rounded bg-gray-100 px-2 py-1 font-mono text-xs">
                      Ctrl+Z
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* パネルフッター */}
      <div className="border-t border-gray-200 bg-gray-50 p-4">
        <Button variant="outline" size="sm" className="w-full" onClick={onClose}>
          閉じる
        </Button>
      </div>
    </div>
  );
}
