import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Mail,
  Layers,
  CreditCard,
  BarChart3,
  Users,
  ArrowRight,
  Check,
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "LINE配信",
    description: "ステップ配信、セグメント配信、リッチメニューまで完全対応",
  },
  {
    icon: Mail,
    title: "メール配信",
    description: "HTMLメール、A/Bテスト、自動配信シナリオを簡単に作成",
  },
  {
    icon: Layers,
    title: "ファネル作成",
    description: "ドラッグ&ドロップでLP、サンクスページを素早く構築",
  },
  {
    icon: CreditCard,
    title: "決済連携",
    description: "Stripe連携で単発決済からサブスクリプションまで",
  },
  {
    icon: Users,
    title: "会員サイト",
    description: "オンラインコースの配信と進捗管理が可能",
  },
  {
    icon: BarChart3,
    title: "分析・レポート",
    description: "ファネル分析、配信効果測定、売上レポートを一元管理",
  },
];

const benefits = [
  "複数ツールの契約が不要",
  "顧客データを一元管理",
  "AIによるコピーライティング支援",
  "ノーコードで直感的に操作",
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">MarketingHub</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">ログイン</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">無料で始める</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
            1つのプラットフォームで
            <br />
            <span className="text-primary">マーケティングを完結</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            LINE配信、メール配信、LP作成、会員サイト、決済まで。
            <br />
            複数のツールを行き来する必要はもうありません。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">
                無料で始める
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">機能を見る</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">オールインワン機能</h2>
            <p className="text-muted-foreground">
              マーケティングに必要なすべての機能を1つに
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <feature.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            今すぐMarketingHubを始めましょう
          </h2>
          <p className="text-lg opacity-90 mb-8">
            14日間の無料トライアル。クレジットカード不要。
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/signup">
              無料で始める
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="font-semibold">MarketingHub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; 2025 MarketingHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
