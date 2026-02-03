"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { useTenant } from "@/hooks/use-tenant";
import type { CampaignFormData } from "@/types/campaign";

export default function NewCampaignPage() {
  const router = useRouter();
  const { tenantId, loading: tenantLoading } = useTenant();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CampaignFormData) => {
    if (!tenantId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          ...data,
        }),
      });

      if (res.ok) {
        const { campaign } = await res.json();
        router.push(`/campaigns/${campaign.id}/edit`);
      } else {
        const error = await res.json();
        alert(error.error || "作成に失敗しました");
      }
    } catch (error) {
      console.error("Failed to create campaign:", error);
      alert("作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/campaigns">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">新規キャンペーン作成</h1>
          <p className="text-muted-foreground">
            配信キャンペーンを作成します
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <CampaignForm
          onSubmit={handleSubmit}
          onCancel={() => router.push("/campaigns")}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
