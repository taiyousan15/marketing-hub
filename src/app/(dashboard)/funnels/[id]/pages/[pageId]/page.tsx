"use client";

import { useState, useEffect, use } from "react";
import { ComponentInstance } from "@/components/lp-builder/types";
import { LPBuilder } from "@/components/lp-builder";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PageData {
  id: string;
  name: string;
  slug: string;
  content: ComponentInstance[];
  funnel: {
    id: string;
    name: string;
    type: string;
    status: string;
  };
}

export default function FunnelPageEditorPage({
  params,
}: {
  params: Promise<{ id: string; pageId: string }>;
}) {
  const { id: funnelId, pageId } = use(params);
  const [page, setPage] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  const fetchPage = async () => {
    try {
      const res = await fetch(`/api/funnels/${funnelId}/pages/${pageId}`);
      if (!res.ok) throw new Error("Failed to fetch page");
      const data = await res.json();
      setPage(data.page);
    } catch {
      toast.error("ページの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (components: ComponentInstance[]) => {
    const res = await fetch(`/api/funnels/${funnelId}/pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: components }),
    });
    if (!res.ok) throw new Error("保存に失敗しました");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">ページが見つかりません</p>
      </div>
    );
  }

  const hasContent = Array.isArray(page.content) && page.content.length > 0;

  return (
    <LPBuilder
      initialComponents={hasContent ? page.content : []}
      onSave={handleSave}
      pageTitle={page.name}
      pageSubtitle={`/${page.slug}`}
      backUrl={`/funnels/${funnelId}`}
      funnelId={funnelId}
      pageId={pageId}
      skipModeSelector={hasContent}
    />
  );
}
