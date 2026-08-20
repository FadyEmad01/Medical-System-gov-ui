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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { isAuthActionError } from "../../hooks/session-guard";

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5, 6, 7];

export function ProfileLoading() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-4 w-40" />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Skeleton className="size-44 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
          <div className="flex w-full flex-col gap-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-4 w-44" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {SKELETON_ROWS.map((row) => (
              <div key={row} className="flex flex-col gap-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
