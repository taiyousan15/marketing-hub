"use client";

import { useEffect, useState } from "react";
import { Search, User } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationCenter } from "@/components/layout/notification-center";
import { CommandPalette } from "@/components/layout/command-palette";

const isClerkConfigured =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_");

function UserAvatar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Avatar className="h-8 w-8">
        <AvatarFallback>
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
    );
  }

  if (isClerkConfigured) {
    return (
      <UserButton
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: "h-8 w-8",
          },
        }}
      />
    );
  }

  return (
    <Avatar className="h-8 w-8">
      <AvatarFallback>
        <User className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
  );
}

export function Header() {
  return (
    <>
      <CommandPalette />
      <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />

        <div className="flex-1">
          <Button
            variant="outline"
            className="hidden md:flex items-center gap-2 w-full max-w-sm text-muted-foreground justify-start"
            onClick={() => {
              document.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", metaKey: true })
              );
            }}
          >
            <Search className="h-4 w-4" />
            <span>検索...</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <NotificationCenter />
          <UserAvatar />
        </div>
      </header>
    </>
  );
}
