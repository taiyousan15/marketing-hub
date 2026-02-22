import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, ExternalLink } from 'lucide-react';
import { FormBuilder } from '@/components/forms/form-builder';
import { getForm } from '@/actions/forms';

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  DRAFT: { label: '下書き', class: 'bg-gray-100 text-gray-600' },
  PUBLISHED: { label: '公開中', class: 'bg-green-100 text-green-700' },
  CLOSED: { label: 'クローズ', class: 'bg-red-100 text-red-600' },
};

export default async function FormEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const form = await getForm(id);

  if (!form) notFound();

  const statusInfo = STATUS_LABELS[form.status] ?? { label: form.status, class: '' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{form.name}</h1>
              <Badge className={statusInfo.class}>{statusInfo.label}</Badge>
            </div>
            {form.description && (
              <p className="text-sm text-muted-foreground">{form.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/forms/${id}/responses`}>
              <Eye className="h-4 w-4 mr-1" />
              回答 ({form._count.submissions})
            </Link>
          </Button>
          {form.status === 'PUBLISHED' && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/f/${id}`} target="_blank">
                <ExternalLink className="h-4 w-4 mr-1" />
                公開URL
              </Link>
            </Button>
          )}
        </div>
      </div>

      <FormBuilder
        formId={form.id}
        formName={form.name}
        formDescription={form.description}
        initialFields={form.fields as any}
      />
    </div>
  );
}
