"use client";

import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { DocumentSlotOptionalValues } from "../../hooks/use-document-slots";

/** Collapsible optional metadata (document number / expiry) for one slot. */
export function OptionalDocumentFields({
  value,
  onChange,
}: {
  value: DocumentSlotOptionalValues;
  onChange: (values: DocumentSlotOptionalValues) => void;
}) {
  const t = useTranslations("insurance");
  const documentNumberId = useId();
  const expiresAtId = useId();

  return (
    <Collapsible className="ps-4">
      <CollapsibleTrigger asChild>
        <Button variant="link" size="sm" className="px-0">
          <ChevronDownIcon data-icon="inline-start" />
          {t("documents.additionalInfo")}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-3 py-2">
        <div className="grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={documentNumberId}>
              {t("documents.documentNumber")}
            </FieldLabel>
            <FieldContent>
              <Input
                id={documentNumberId}
                value={value.documentNumber ?? ""}
                onChange={(event) =>
                  onChange({ ...value, documentNumber: event.target.value })
                }
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor={expiresAtId}>
              {t("documents.expiresAt")}
            </FieldLabel>
            <FieldContent>
              <Input
                id={expiresAtId}
                type="date"
                value={value.expiresAt ?? ""}
                onChange={(event) =>
                  onChange({ ...value, expiresAt: event.target.value })
                }
              />
            </FieldContent>
          </Field>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("documents.additionalInfoHint")}
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}
