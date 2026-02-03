import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Clerkが設定されているかチェック
const isClerkConfigured =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_");

export default function SignUpPage() {
  if (isClerkConfigured) {
    const { SignUp } = require("@clerk/nextjs");
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-primary hover:bg-primary/90 text-sm normal-case",
            },
          }}
        />
      </div>
    );
  }

  // Clerkが設定されていない場合はセットアップ案内
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>認証の設定が必要です</CardTitle>
          <CardDescription>
            新規登録機能を使用するにはClerkの設定が必要です
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            1. <a href="https://clerk.com" target="_blank" rel="noopener" className="underline">Clerk</a>でアカウントを作成
          </p>
          <p className="text-sm text-muted-foreground">
            2. .envファイルに以下を設定：
          </p>
          <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...`}
          </pre>
          <Button asChild className="w-full">
            <Link href="/">ホームに戻る</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
