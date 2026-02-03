"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  Mail,
  MessageSquare,
  Phone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ContactForm } from "@/components/contacts/contact-form";
import { CsvImportModal } from "@/components/contacts/csv-import-modal";
import { toast } from "sonner";

// サンプルデータ（後でAPIから取得）
const sampleContacts = [
  {
    id: "1",
    name: "田中 太郎",
    email: "tanaka@example.com",
    lineUserId: "U1234567890",
    phone: "090-1234-5678",
    score: 85,
    tags: ["購入者", "VIP"],
    createdAt: "2025-01-15",
  },
  {
    id: "2",
    name: "鈴木 花子",
    email: "suzuki@example.com",
    lineUserId: "U0987654321",
    phone: null,
    score: 45,
    tags: ["見込み客"],
    createdAt: "2025-01-20",
  },
  {
    id: "3",
    name: "佐藤 一郎",
    email: null,
    lineUserId: "U5555555555",
    phone: "080-9876-5432",
    score: 60,
    tags: ["セミナー参加者"],
    createdAt: "2025-01-25",
  },
];

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleExport = useCallback(() => {
    const headers = ["name", "email", "phone", "lineUserId", "score", "createdAt"];
    const csvContent = [
      headers.join(","),
      ...sampleContacts.map((c) =>
        [c.name, c.email || "", c.phone || "", c.lineUserId || "", c.score, c.createdAt].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts_" + new Date().toISOString().split("T")[0] + ".csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("エクスポートが完了しました");
  }, []);

  const filteredContacts = sampleContacts.filter(
    (contact) =>
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">コンタクト</h1>
          <p className="text-muted-foreground">
            顧客情報を一元管理できます
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            インポート
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            エクスポート
          </Button>
          <Button size="sm" onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            新規追加
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="名前、メール、電話番号で検索..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              フィルター
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名前</TableHead>
                <TableHead>連絡先</TableHead>
                <TableHead>タグ</TableHead>
                <TableHead>スコア</TableHead>
                <TableHead>登録日</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    コンタクトが見つかりません
                  </TableCell>
                </TableRow>
              ) : (
                filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="flex items-center gap-3 hover:underline"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {contact.name?.slice(0, 2) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {contact.name || "名前なし"}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {contact.email && (
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        )}
                        {contact.lineUserId && (
                          <MessageSquare className="h-4 w-4 text-green-500" />
                        )}
                        {contact.phone && (
                          <Phone className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            contact.score >= 70
                              ? "bg-green-500"
                              : contact.score >= 40
                              ? "bg-yellow-500"
                              : "bg-gray-300"
                          }`}
                        />
                        {contact.score}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.createdAt}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>アクション</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/contacts/${contact.id}`}>
                              詳細を表示
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>タグを追加</DropdownMenuItem>
                          <DropdownMenuItem>メッセージを送信</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            削除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ContactForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          // TODO: Refresh contacts list
        }}
      />

      <CsvImportModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={() => {
          // TODO: Refresh contacts list
        }}
      />
    </div>
  );
}
