"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Send,
  Layers,
  GraduationCap,
  ShoppingCart,
  Calendar,
  BarChart3,
  MessageSquare,
  Tag,
  Receipt,
  Mail,
  CreditCard,
  MessagesSquare,
  Bot,
  Sparkles,
  Workflow,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "ダッシュボード",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "LINEチャット",
    url: "/chat",
    icon: MessagesSquare,
  },
  {
    title: "コンタクト",
    url: "/contacts",
    icon: Users,
  },
  {
    title: "タグ",
    url: "/tags",
    icon: Tag,
  },
  {
    title: "配信",
    url: "/campaigns",
    icon: Send,
  },
  {
    title: "AI自動化",
    url: "/automation",
    icon: Workflow,
  },
  {
    title: "ファネル",
    url: "/funnels",
    icon: Layers,
  },
  {
    title: "会員サイト",
    url: "/courses",
    icon: GraduationCap,
  },
  {
    title: "商品",
    url: "/products",
    icon: ShoppingCart,
  },
  {
    title: "注文",
    url: "/orders",
    icon: Receipt,
  },
  {
    title: "イベント",
    url: "/events",
    icon: Calendar,
  },
  {
    title: "分析",
    url: "/analytics",
    icon: BarChart3,
  },
];

const settingsItems = [
  {
    title: "LINE設定",
    url: "/settings/line",
    icon: MessageSquare,
  },
  {
    title: "Bot設定",
    url: "/settings/bot",
    icon: Bot,
  },
  {
    title: "AI設定",
    url: "/settings/ai",
    icon: Sparkles,
  },
  {
    title: "メール設定",
    url: "/settings/email",
    icon: Mail,
  },
  {
    title: "決済設定",
    url: "/settings/payments",
    icon: CreditCard,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">MarketingHub</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>メインメニュー</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || pathname.startsWith(`${item.url}/`)}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>システム</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || pathname.startsWith(`${item.url}/`)}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          MarketingHub v1.0.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
