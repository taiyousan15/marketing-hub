"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  RefreshCw,
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
import { getContacts, getTags, deleteContact } from "@/actions/contacts";

interface Contact {
  id: string;
  name: string | null;
  email: string | null;
  lineUserId: string | null;
  phone: string | null;
  score: number;
  tags: Array<{ id: string; name: string; color: string }>;
  createdAt: Date;
}

interface Tag {
  id: string;
  name: string;
  color: string;
  _count: { contacts: number };
}

export default function ContactsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedTagId, setSelectedTagId] = useState<string | undefined>();

  // データ取得
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getContacts({
        search: searchQuery || undefined,
        tagId: selectedTagId,
        limit: 50,
        offset: 0,
      });
      setContacts(result.contacts as Contact[]);
      setTotal(result.total);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
      toast.error("コンタクトの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedTagId]);

  const fetchTags = useCallback(async () => {
    try {
      const result = await getTags();
      setTags(result as Tag[]);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
    fetchTags();
  }, [fetchContacts, fetchTags]);

  // 検索の遅延実行
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedTagId, fetchContacts]);

  const handleExport = useCallback(() => {
    const headers = ["name", "email", "phone", "lineUserId", "score", "createdAt"];
    const csvContent = [
      headers.join(","),
      ...contacts.map((c) =>
        [
          c.name || "",
          c.email || "",
          c.phone || "",
          c.lineUserId || "",
          c.score,
          c.createdAt instanceof Date ? c.createdAt.toISOString().split("T")[0] : c.createdAt,
        ].join(",")
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
  }, [contacts]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("本当にこのコンタクトを削除しますか？")) return;
    try {
      await deleteContact(id);
      toast.success("コンタクトを削除しました");
      fetchContacts();
    } catch (error) {
      console.error("Failed to delete contact:", error);
      toast.error("削除に失敗しました");
    }
  }, [fetchContacts]);

  const handleRefresh = useCallback(() => {
    fetchContacts();
    toast.success("更新しました");
  }, [fetchContacts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">コンタクト</h1>
          <p className="text-muted-foreground">
            顧客情報を一元管理できます（{total}件）
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            更新
          </Button>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  {selectedTagId
                    ? tags.find((t) => t.id === selectedTagId)?.name
                    : "フィルター"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>タグでフィルター</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedTagId(undefined)}>
                  すべて表示
                </DropdownMenuItem>
                {tags.map((tag) => (
                  <DropdownMenuItem
                    key={tag.id}
                    onClick={() => setSelectedTagId(tag.id)}
                  >
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name} ({tag._count.contacts})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    読み込み中...
                  </TableCell>
                </TableRow>
              ) : contacts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    コンタクトが見つかりません
                  </TableCell>
                </TableRow>
              ) : (
                contacts.map((contact) => (
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
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            style={{
                              backgroundColor: `${tag.color}20`,
                              color: tag.color,
                            }}
                          >
                            {tag.name}
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
                      {contact.createdAt instanceof Date
                        ? contact.createdAt.toLocaleDateString("ja-JP")
                        : new Date(contact.createdAt).toLocaleDateString("ja-JP")}
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
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(contact.id)}
                          >
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
          fetchContacts();
        }}
      />

      <CsvImportModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={() => {
          fetchContacts();
        }}
      />
    </div>
  );
}
