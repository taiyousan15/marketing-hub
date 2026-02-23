"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Send,
  Layers,
  FileText,
  ShoppingCart,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface SearchResult {
  id: string;
  label: string;
  description?: string;
  href: string;
  type: string;
}

interface SearchResults {
  contacts: SearchResult[];
  campaigns: SearchResult[];
  funnels: SearchResult[];
  forms: SearchResult[];
  products: SearchResult[];
}

const typeIcons: Record<string, typeof Users> = {
  contact: Users,
  campaign: Send,
  funnel: Layers,
  form: FileText,
  product: ShoppingCart,
};

const typeLabels: Record<string, string> = {
  contacts: "コンタクト",
  campaigns: "キャンペーン",
  funnels: "ファネル",
  forms: "フォーム",
  products: "商品",
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery("");
    setResults(null);
    router.push(href);
  };

  const hasResults =
    results &&
    Object.values(results).some((arr) => arr.length > 0);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="検索... (コンタクト、キャンペーン、ファネル、フォーム、商品)"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {loading && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            検索中...
          </div>
        )}
        {!loading && query.length >= 2 && !hasResults && (
          <CommandEmpty>結果が見つかりません</CommandEmpty>
        )}
        {results &&
          (Object.entries(results) as [string, SearchResult[]][]).map(
            ([key, items]) => {
              if (items.length === 0) return null;
              return (
                <CommandGroup key={key} heading={typeLabels[key] ?? key}>
                  {items.map((item) => {
                    const Icon = typeIcons[item.type] ?? FileText;
                    return (
                      <CommandItem
                        key={item.id}
                        value={item.label}
                        onSelect={() => handleSelect(item.href)}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        <span>{item.label}</span>
                        {item.description && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              );
            }
          )}
      </CommandList>
    </CommandDialog>
  );
}
