'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string | null;
  required: boolean;
  options?: string[] | null;
  order: number;
}

interface FormPreviewProps {
  name: string;
  description?: string | null;
  fields: FormField[];
  onSubmit?: (data: Record<string, unknown>) => void;
}

export function FormPreview({ name, description, fields, onSubmit }: FormPreviewProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});

  const handleChange = (fieldId: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(values);
  };

  const renderField = (field: FormField) => {
    const commonProps = {
      id: field.id,
      required: field.required,
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <Input
            {...commonProps}
            type={field.type}
            placeholder={field.placeholder ?? ''}
            value={(values[field.id] as string) ?? ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
          />
        );
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            placeholder={field.placeholder ?? ''}
            value={(values[field.id] as string) ?? ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            rows={3}
          />
        );
      case 'select':
        return (
          <Select
            value={(values[field.id] as string) ?? ''}
            onValueChange={(v) => handleChange(field.id, v)}
          >
            <SelectTrigger id={field.id}>
              <SelectValue placeholder={field.placeholder ?? '選択してください'} />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              id={field.id}
              checked={(values[field.id] as boolean) ?? false}
              onCheckedChange={(checked: boolean) => handleChange(field.id, checked)}
            />
            <label htmlFor={field.id} className="text-sm">{field.placeholder ?? field.label}</label>
          </div>
        );
      case 'radio':
        return (
          <RadioGroup
            value={(values[field.id] as string) ?? ''}
            onValueChange={(v: string) => handleChange(field.id, v)}
          >
            {(field.options ?? []).map((opt: string) => (
              <div key={opt} className="flex items-center gap-2">
                <RadioGroupItem value={opt} id={`${field.id}-${opt}`} />
                <Label htmlFor={`${field.id}-${opt}`} className="text-sm">{opt}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      case 'date':
        return (
          <Input
            {...commonProps}
            type="date"
            value={(values[field.id] as string) ?? ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl border shadow-sm p-6">
      <h2 className="text-xl font-bold mb-1">{name}</h2>
      {description && (
        <p className="text-sm text-muted-foreground mb-6">{description}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {fields.sort((a, b) => a.order - b.order).map((field) => (
          <div key={field.id} className="space-y-2">
            {field.type !== 'checkbox' && (
              <Label htmlFor={field.id} className="text-sm font-medium">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            )}
            {renderField(field)}
          </div>
        ))}

        <Button type="submit" className="w-full mt-4">
          送信する
        </Button>
      </form>
    </div>
  );
}
