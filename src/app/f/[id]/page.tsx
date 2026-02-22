'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string | null;
  required: boolean;
  options?: unknown;
  order: number;
}

interface FormData {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  fields: FormField[];
}

export default function PublicFormPage() {
  const params = useParams<{ id: string }>();
  const formId = params.id;

  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [checkboxValues, setCheckboxValues] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await fetch(`/api/forms/${formId}`);
        if (!res.ok) throw new Error('Form not found');
        const data = await res.json();
        setForm(data);
      } catch {
        setForm(null);
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [formId]);

  const handleChange = (fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
    setCheckboxValues((prev) => {
      const current = prev[fieldId] ?? [];
      const next = checked
        ? [...current, option]
        : current.filter((v) => v !== option);
      return { ...prev, [fieldId]: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    const missingRequired = form.fields.some((field) => {
      if (!field.required) return false;
      if (field.type === 'checkbox') {
        return (checkboxValues[field.id] ?? []).length === 0;
      }
      return !values[field.id]?.trim();
    });

    if (missingRequired) {
      toast.error('必須項目を入力してください');
      return;
    }

    const data: Record<string, unknown> = { ...values };
    form.fields
      .filter((f) => f.type === 'checkbox')
      .forEach((f) => {
        data[f.id] = (checkboxValues[f.id] ?? []).join(', ');
      });

    setSubmitting(true);
    try {
      const res = await fetch(`/api/forms/${formId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Submit failed');
      }
      setSubmitted(true);
    } catch (error) {
      console.error('Submission failed:', error);
      toast.error('送信に失敗しました。もう一度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
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
          <p className="text-lg font-medium text-gray-700">フォームが見つかりません</p>
          <p className="text-sm text-gray-500 mt-1">このフォームは現在利用できません</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-xl font-semibold">送信が完了しました</h2>
          <p className="text-muted-foreground">ご回答ありがとうございました。</p>
        </div>
      </div>
    );
  }

  const sortedFields = [...form.fields].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-xl shadow-sm p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{form.name}</h1>
          {form.description && (
            <p className="text-muted-foreground mt-1">{form.description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {sortedFields.map((field) => (
            <div key={field.id} className="space-y-1.5">
              <Label>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>

              {field.type === 'textarea' ? (
                <Textarea
                  placeholder={field.placeholder ?? ''}
                  value={values[field.id] ?? ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  rows={4}
                  required={field.required}
                />
              ) : field.type === 'select' ? (
                <Select
                  value={values[field.id] ?? ''}
                  onValueChange={(v) => handleChange(field.id, v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder ?? '選択してください'} />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options as string[] | null)?.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'checkbox' ? (
                <div className="space-y-2">
                  {(field.options as string[] | null)?.map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <Checkbox
                        id={`${field.id}-${opt}`}
                        checked={(checkboxValues[field.id] ?? []).includes(opt)}
                        onCheckedChange={(checked: boolean) =>
                          handleCheckboxChange(field.id, opt, checked)
                        }
                      />
                      <label htmlFor={`${field.id}-${opt}`} className="text-sm">
                        {opt}
                      </label>
                    </div>
                  ))}
                </div>
              ) : field.type === 'radio' ? (
                <div className="space-y-2">
                  {(field.options as string[] | null)?.map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <input
                        type="radio"
                        id={`${field.id}-${opt}`}
                        name={field.id}
                        value={opt}
                        checked={values[field.id] === opt}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        className="h-4 w-4"
                      />
                      <label htmlFor={`${field.id}-${opt}`} className="text-sm">
                        {opt}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <Input
                  type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : field.type === 'date' ? 'date' : 'text'}
                  placeholder={field.placeholder ?? ''}
                  value={values[field.id] ?? ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  required={field.required}
                />
              )}
            </div>
          ))}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            送信する
          </Button>
        </form>
      </div>
    </div>
  );
}
