"use client";

import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function DatePicker({
  className,
  id,
  value,
  onChange,
  "aria-invalid": ariaInvalid,
}: {
  className?: string;
  id?: string;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  "aria-invalid"?: boolean;
}) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [internal, setInternal] = React.useState<Date>();
  const date = value ?? internal;
  const handleSelect = (next: Date | undefined) => {
    setInternal(next);
    onChange?.(next);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          data-empty={!date}
          aria-invalid={ariaInvalid}
          className={cn(
            "w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground bg-secondary",
            className,
          )}
        >
          <CalendarIcon data-icon="inline-start" />
          {date ? (
            format(date, "PPP", { locale: locale === "ar" ? arSA : enUS })
          ) : (
            <span>{t("pickDate")}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          className="rounded-lg border"
          captionLayout="dropdown"
          startMonth={new Date(1900, 0)}
          endMonth={new Date()}
          disabled={{ after: new Date() }}
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
