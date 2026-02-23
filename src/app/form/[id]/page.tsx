'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { z } from 'zod';
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
import { Loader2, CheckCircle2 } from 'lucide-react';

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder: string | null;
  required: boolean;
  options: string[] | null;
  order: number;
}

interface PublicForm {
  id: string;
  name: string;
  description: string | null;
  status: string;
  fields: FormField[];
}

type FieldValue = string | boolean | string[];

export default function PublicFormPage() {
  const params = useParams<{ id: string }>();
  const formId = params.id;

  const [form, setForm] = useState<PublicForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [values, setValues] = useState<Record<string, FieldValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetchForm() {
      try {
        const res = await fetch(`/api/forms/${formId}`);
        if (!res.ok) throw new Error('Form not found');
        const data: PublicForm = await res.json();
        setForm(data);

        // 初期値セット
        const initial: Record<string, FieldValue> = {};
        for (const field of data.fields) {
          if (field.type === 'checkbox') initial[field.id] = false;
          else if (field.type === 'radio' && field.options?.length) initial[field.id] = '';
          else initial[field.id] = '';
        }
        setValues(initial);
      } catch {
        // form not found / closed
      } finally {
        setIsLoading(false);
      }
    }
    fetchForm();
  }, [formId]);

  const validate = (): boolean => {
    if (!form) return false;
    const newErrors: Record<string, string> = {};

    for (const field of form.fields) {
      if (!field.required) continue;
      const val = values[field.id];
      if (field.type === 'checkbox' && !val) {
        newErrors[field.id] = `${field.label}は必須項目です`;
        continue;
      }
      if (typeof val === 'string' && !val.trim()) {
        newErrors[field.id] = `${field.label}は必須項目です`;
        continue;
      }
      if (field.type === 'email' && typeof val === 'string') {
        const emailResult = z.string().email().safeParse(val);
        if (!emailResult.success) {
          newErrors[field.id] = '有効なメールアドレスを入力してください';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/forms/${formId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: values }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Submission failed');
      }

      setSubmitted(true);
    } catch (err) {
      setErrors({ _form: err instanceof Error ? err.message : '送信に失敗しました' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!form || form.status !== 'PUBLISHED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-700">フォームが見つかりません</p>
          <p className="text-sm text-gray-500 mt-2">このフォームは公開されていないか、存在しません。</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <p className="text-2xl font-bold text-gray-800">送信完了</p>
          <p className="text-gray-600 mt-2">回答ありがとうございました。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{form.name}</h1>
          {form.description && (
            <p className="text-gray-600 mb-6">{form.description}</p>
          )}

          {errors._form && (
            <p className="text-sm text-red-600 mb-4 p-3 bg-red-50 rounded-lg">
              {errors._form}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {form.fields.map((field) => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={values[field.id] ?? ''}
                error={errors[field.id]}
                onChange={(val) => {
                  setValues((prev) => ({ ...prev, [field.id]: val }));
                  if (errors[field.id]) {
                    setErrors((prev) => {
                      const { [field.id]: _, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
              />
            ))}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  送信中...
                </>
              ) : (
                '送信する'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  error,
  onChange,
}: {
  field: FormField;
  value: FieldValue;
  error?: string;
  onChange: (val: FieldValue) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={field.id} className="text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {field.type === 'text' && (
        <Input
          id={field.id}
          type="text"
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? undefined}
          className={error ? 'border-red-400' : ''}
        />
      )}

      {field.type === 'email' && (
        <Input
          id={field.id}
          type="email"
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? 'example@email.com'}
          className={error ? 'border-red-400' : ''}
        />
      )}

      {field.type === 'tel' && (
        <Input
          id={field.id}
          type="tel"
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? '090-0000-0000'}
          className={error ? 'border-red-400' : ''}
        />
      )}

      {field.type === 'textarea' && (
        <Textarea
          id={field.id}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? undefined}
          rows={4}
          className={error ? 'border-red-400' : ''}
        />
      )}

      {field.type === 'date' && (
        <Input
          id={field.id}
          type="date"
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          className={error ? 'border-red-400' : ''}
        />
      )}

      {field.type === 'select' && field.options && (
        <Select
          value={value as string}
          onValueChange={(v) => onChange(v)}
        >
          <SelectTrigger className={error ? 'border-red-400' : ''}>
            <SelectValue placeholder={field.placeholder ?? '選択してください'} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.type === 'radio' && field.options && (
        <RadioGroup
          value={value as string}
          onValueChange={(v) => onChange(v)}
          className="space-y-2"
        >
          {field.options.map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <RadioGroupItem value={opt} id={`${field.id}-${opt}`} />
              <Label htmlFor={`${field.id}-${opt}`} className="font-normal cursor-pointer">
                {opt}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {field.type === 'checkbox' && (
        <div className="flex items-center gap-2">
          <Checkbox
            id={field.id}
            checked={value as boolean}
            onCheckedChange={(checked) => onChange(!!checked)}
          />
          <Label htmlFor={field.id} className="font-normal cursor-pointer">
            {field.placeholder ?? field.label}
          </Label>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
