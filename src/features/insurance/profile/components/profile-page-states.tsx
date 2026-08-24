"use client";

import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { isAuthActionError } from "../../hooks/session-guard";

/** One "key fact" slot: a muted label bar over a value bar. */
function KeyFactSkeleton() {
  return (
    <div className="flex flex-col gap-1">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-5 w-40" />
    </div>
  );
}

/**
 * Loading placeholder mirroring the loaded profile page 1:1 — hero row, tab
 * strip, and the three-column overview grid — so the arrival of data causes
 * zero layout shift.
 */
export function ProfileLoading() {
  return (
    <div aria-hidden="true" className="flex flex-col">
      {/* Hero: ring + identity stack, edit button at the row end on desktop. */}
      <header className="flex flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between md:gap-6 md:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Skeleton className="size-18 shrink-0 rounded-full sm:size-23" />
          <div className="flex min-w-0 flex-col gap-1.5">
            <Skeleton className="h-7 w-48 max-w-full sm:h-8" />
            <Skeleton className="h-5 w-64 max-w-full" />
            <div className="flex flex-wrap gap-1.5">
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-5 w-14 rounded-md" />
            </div>
          </div>
        </div>
        <Skeleton className="hidden h-7 w-24 shrink-0 self-start sm:block md:self-auto" />
      </header>

      {/* Tab strip: two trigger-sized slots inside the same scroll wrapper. */}
      <div className="overflow-x-auto overscroll-x-contain border-y">
        <div className="flex w-max min-w-min items-center gap-4 px-4">
          <div className="shrink-0 rounded-md border border-transparent px-1.5 py-0.5">
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="shrink-0 rounded-md border border-transparent px-1.5 py-0.5">
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </div>

      {/* Overview grid: about + key facts | separator | status rail. */}
      <div className="grid gap-6 px-4 py-4 md:px-6 lg:grid-cols-[minmax(0,1fr)_auto_18rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-5 w-full max-w-lg" />
          </div>
          <section className="flex flex-col gap-3">
            <Skeleton className="h-5 w-20" />
            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3 xl:gap-12">
              <KeyFactSkeleton />
              <KeyFactSkeleton />
              <KeyFactSkeleton />
              <KeyFactSkeleton />
              <KeyFactSkeleton />
              <KeyFactSkeleton />
            </div>
          </section>
        </div>
        <Separator orientation="vertical" className="hidden lg:block" />
        <aside className="flex flex-col gap-3">
          <Skeleton className="h-4 w-16" />
          <div className="flex items-center gap-2">
            <Skeleton className="size-2 shrink-0 rounded-full" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-4 w-36" />
          <Separator />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        </aside>
      </div>
    </div>
  );
}

export function ProfileError({
  error,
  isRefetching,
  onRetry,
}: {
  error: unknown;
  isRefetching: boolean;
  onRetry: () => void;
}) {
  const ta = useTranslations("auth");
  const ti = useTranslations("insurance");

  let message = ti("errors.generic");
  if (isAuthActionError(error)) {
    if (error.kind === "notFound") {
      message = ti("errors.notFound");
    } else if (error.kind === "unauthorized") {
      // 401: the session is dead — sign in again.
      message = ti("errors.sessionExpired");
    } else if (error.kind === "forbidden") {
      // 403: authenticated but lacking permission — the session is fine.
      message = ti("errors.forbidden");
    }
  }

  return (
    <Alert variant="destructive">
      <CircleAlert />
      <AlertTitle>{ti("profile.loadFailed")}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      <AlertAction>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={isRefetching}
        >
          {isRefetching && <Spinner data-icon="inline-start" />}
          {ta("retry")}
        </Button>
      </AlertAction>
    </Alert>
  );
}
