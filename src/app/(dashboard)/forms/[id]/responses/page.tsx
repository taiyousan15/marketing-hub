import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, FileText } from 'lucide-react';
import { getForm, getFormSubmissions } from '@/actions/forms';

export default async function FormResponsesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [form, submissionsResult] = await Promise.all([
    getForm(id),
    getFormSubmissions(id),
  ]);

  if (!form) notFound();

  const submissions = submissionsResult.submissions;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/forms/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{form.name} — 回答一覧</h1>
          <p className="text-muted-foreground">{submissions.length}件の回答</p>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">まだ回答がありません</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">回答データ</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">送信日時</TableHead>
                  {form.fields.map((field) => (
                    <TableHead key={field.id}>{field.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => {
                  const data = submission.data as Record<string, string>;
                  return (
                    <TableRow key={submission.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(submission.createdAt).toLocaleString('ja-JP')}
                      </TableCell>
                      {form.fields.map((field) => (
                        <TableCell key={field.id} className="text-sm">
                          {data[field.id] ?? '—'}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
