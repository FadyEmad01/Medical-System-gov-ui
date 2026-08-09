import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Globe } from "lucide-react";

export default function LanguageSwitcher({ className, size = "sm" }: { className?: string; size?: "sm" | "default" }) {
    return (
        <Select defaultValue="ar">
            <SelectTrigger className={cn("bg-secondary border-0 font-almarai", className)} size={size} aria-label="Language">
                <Globe className="size-4" />
                <SelectValue />
            </SelectTrigger>
            <SelectContent className="font-almarai">
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
            </SelectContent>
        </Select>
    )
}
