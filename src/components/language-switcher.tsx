"use client";

import { Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function LanguageSwitcher({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "sm" | "default";
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  return (
    <Select
      value={locale}
      onValueChange={(v) => router.replace(pathname, { locale: v })}
    >
      <SelectTrigger
        className={cn("bg-secondary border-0 font-almarai", className)}
        size={size}
        aria-label="Language"
      >
        <Globe className="size-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="font-almarai">
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="ar">العربية</SelectItem>
      </SelectContent>
    </Select>
  );
}
