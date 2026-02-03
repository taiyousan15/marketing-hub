"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface CsvImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ParsedRow {
  name: string;
  email?: string;
  phone?: string;
  lineUserId?: string;
}

type ImportStatus = "idle" | "parsing" | "preview" | "importing" | "complete" | "error";

export function CsvImportModal({ open, onOpenChange, onSuccess }: CsvImportModalProps) {
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [importResults, setImportResults] = useState({ success: 0, failed: 0 });

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSVファイルにデータがありません");
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const nameIndex = headers.findIndex((h) => h === "name" || h === "名前");
    const emailIndex = headers.findIndex((h) => h === "email" || h === "メール" || h === "メールアドレス");
    const phoneIndex = headers.findIndex((h) => h === "phone" || h === "電話" || h === "電話番号");
    const lineIndex = headers.findIndex((h) => h === "lineuserid" || h === "line" || h === "line_id");

    if (nameIndex === -1) {
      throw new Error("名前（name）列が見つかりません");
    }

    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const name = values[nameIndex];
      if (!name) continue;

      rows.push({
        name,
        email: emailIndex >= 0 ? values[emailIndex] || undefined : undefined,
        phone: phoneIndex >= 0 ? values[phoneIndex] || undefined : undefined,
        lineUserId: lineIndex >= 0 ? values[lineIndex] || undefined : undefined,
      });
    }

    return rows;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setStatus("parsing");
    setErrorMessage("");

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = parseCSV(text);
        setParsedData(data);
        setStatus("preview");
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "CSVの解析に失敗しました");
        setStatus("error");
      }
    };
    reader.onerror = () => {
      setErrorMessage("ファイルの読み込みに失敗しました");
      setStatus("error");
    };
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    setStatus("importing");
    setProgress(0);

    let success = 0;
    let failed = 0;

    try {
      const { createContact } = await import("@/actions/contacts");

      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        try {
          await createContact({
            name: row.name,
            email: row.email || null,
            phone: row.phone || null,
            lineUserId: row.lineUserId || null,
          });
          success++;
        } catch {
          failed++;
        }
        setProgress(Math.round(((i + 1) / parsedData.length) * 100));
      }

      setImportResults({ success, failed });
      setStatus("complete");
      toast.success("インポートが完了しました: " + success + "件成功、" + failed + "件失敗");
      onSuccess?.();
    } catch {
      setErrorMessage("インポート中にエラーが発生しました");
      setStatus("error");
    }
  };

  const handleClose = () => {
    setStatus("idle");
    setParsedData([]);
    setProgress(0);
    setErrorMessage("");
    setImportResults({ success: 0, failed: 0 });
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const template = "name,email,phone,lineUserId\n田中太郎,tanaka@example.com,090-1234-5678,U1234567890";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>CSVインポート</DialogTitle>
          <DialogDescription>
            CSVファイルからコンタクトを一括インポートします
          </DialogDescription>
        </DialogHeader>

        {status === "idle" && (
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={"border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors " +
                (isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary")}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              {isDragActive ? (
                <p>ここにドロップしてください</p>
              ) : (
                <div>
                  <p className="font-medium">CSVファイルをドラッグ＆ドロップ</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    またはクリックしてファイルを選択
                  </p>
                </div>
              )}
            </div>
            <Button variant="outline" className="w-full" onClick={downloadTemplate}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              テンプレートをダウンロード
            </Button>
          </div>
        )}

        {status === "parsing" && (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4">CSVを解析中...</p>
          </div>
        )}

        {status === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span>{parsedData.length}件のコンタクトが見つかりました</span>
            </div>
            <div className="max-h-[200px] overflow-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left">名前</th>
                    <th className="p-2 text-left">メール</th>
                    <th className="p-2 text-left">電話</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{row.name}</td>
                      <td className="p-2">{row.email || "-"}</td>
                      <td className="p-2">{row.phone || "-"}</td>
                    </tr>
                  ))}
                  {parsedData.length > 5 && (
                    <tr className="border-t">
                      <td colSpan={3} className="p-2 text-center text-muted-foreground">
                        他 {parsedData.length - 5} 件...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {status === "importing" && (
          <div className="space-y-4 py-4">
            <Progress value={progress} />
            <p className="text-center text-sm text-muted-foreground">
              インポート中... {progress}%
            </p>
          </div>
        )}

        {status === "complete" && (
          <div className="flex flex-col items-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="mt-4 font-medium">インポート完了</p>
            <p className="text-sm text-muted-foreground">
              成功: {importResults.success}件 / 失敗: {importResults.failed}件
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center py-8 text-red-500">
            <AlertCircle className="h-12 w-12" />
            <p className="mt-4 font-medium">エラーが発生しました</p>
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}

        <DialogFooter>
          {status === "idle" && (
            <Button variant="outline" onClick={handleClose}>
              キャンセル
            </Button>
          )}
          {status === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStatus("idle")}>
                戻る
              </Button>
              <Button onClick={handleImport}>
                {parsedData.length}件をインポート
              </Button>
            </>
          )}
          {(status === "complete" || status === "error") && (
            <Button onClick={handleClose}>閉じる</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
