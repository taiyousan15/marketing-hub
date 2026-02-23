/**
 * 汎用CSV/JSONエクスポートユーティリティ
 */

interface ExportColumn<T> {
  key: keyof T | string;
  label: string;
  format?: (value: unknown, row: T) => string;
}

/**
 * データをCSV文字列に変換
 */
export function toCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[]
): string {
  const header = columns.map((col) => escapeCSV(col.label)).join(",");

  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = getNestedValue(row, col.key as string);
        const formatted = col.format ? col.format(value, row) : String(value ?? "");
        return escapeCSV(formatted);
      })
      .join(",")
  );

  return [header, ...rows].join("\n");
}

/**
 * CSVフィールドをエスケープ
 */
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * ネストされたオブジェクトの値を取得 (e.g., "contact.name")
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * CSVファイルとしてダウンロード（ブラウザ用）
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * データをJSONファイルとしてダウンロード（ブラウザ用）
 */
export function downloadJSON<T>(data: T[], filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * ワンライナー: データ → CSVダウンロード
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  const csv = toCSV(data, columns);
  downloadCSV(csv, filename);
}
