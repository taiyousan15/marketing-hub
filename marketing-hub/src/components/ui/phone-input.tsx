"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Phone } from "lucide-react";

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  countryCode?: string;
  showIcon?: boolean;
  error?: string;
}

/**
 * 日本の電話番号をフォーマット
 * 090-1234-5678 形式
 */
function formatJapanesePhone(value: string): string {
  // 数字以外を除去
  const digits = value.replace(/\D/g, "");

  // 最大11桁（日本の携帯）
  const truncated = digits.slice(0, 11);

  // フォーマット適用
  if (truncated.length <= 3) {
    return truncated;
  } else if (truncated.length <= 7) {
    return `${truncated.slice(0, 3)}-${truncated.slice(3)}`;
  } else {
    return `${truncated.slice(0, 3)}-${truncated.slice(3, 7)}-${truncated.slice(7)}`;
  }
}

/**
 * E.164形式に変換
 */
function toE164(value: string, countryCode: string = "+81"): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";

  // 先頭の0を除去してカントリーコードを付与
  const withoutLeadingZero = digits.startsWith("0") ? digits.slice(1) : digits;
  return `${countryCode}${withoutLeadingZero}`;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    { className, value, onChange, countryCode = "+81", showIcon = true, error, ...props },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatJapanesePhone(e.target.value);
      onChange(formatted);
    };

    return (
      <div className="space-y-1">
        <div className="relative">
          {showIcon && (
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          )}
          <div className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-muted-foreground border-r pr-2">
            {countryCode}
          </div>
          <Input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={value}
            onChange={handleChange}
            className={cn(
              showIcon ? "pl-20" : "pl-14",
              error && "border-red-500 focus-visible:ring-red-500",
              className
            )}
            placeholder="090-1234-5678"
            ref={ref}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
PhoneInput.displayName = "PhoneInput";

export { PhoneInput, formatJapanesePhone, toE164 };
