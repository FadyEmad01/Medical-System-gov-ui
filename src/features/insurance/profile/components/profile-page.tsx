"use client";

import { CircleAlert, Pencil, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { isAuthActionError } from "../../hooks/session-guard";
import { useProfile } from "../../hooks/use-profile";
import { CompletenessCard } from "./profile-completeness-card";
import { ProfileDetails } from "./profile-details";
import { ProfileEditForm } from "./profile-edit-form";

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5, 6, 7];

function ProfileLoading() {
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

function ProfileError({
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

export default function ProfilePage() {
  const ti = useTranslations("insurance");
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useProfile();
  const [editing, setEditing] = useState(false);
  const [pendingScrollToForm, setPendingScrollToForm] = useState(false);
  const editFormRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (!pendingScrollToForm) return;
    const form = editFormRef.current;
    form?.scrollIntoView({ behavior: "smooth", block: "start" });
    setPendingScrollToForm(false);
  }, [pendingScrollToForm]);

  const startEditingFromCompleteness = () => {
    setEditing(true);
    setPendingScrollToForm(true);
  };

  if (isLoading) return <ProfileLoading />;

  if (isError || !data) {
    return (
      <ProfileError
        error={error}
        isRefetching={isRefetching}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <CompletenessCard profile={data} onEdit={startEditingFromCompleteness} />
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{ti("profile.title")}</CardTitle>
          <CardDescription>{ti("profile.description")}</CardDescription>
          <CardAction>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing((prev) => !prev)}
              aria-pressed={editing}
            >
              {editing ? (
                <X data-icon="inline-start" />
              ) : (
                <Pencil data-icon="inline-start" />
              )}
              {editing ? ti("profile.cancel") : ti("profile.edit")}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {editing ? (
            <ProfileEditForm
              profile={data}
              formRef={editFormRef}
              onCancel={() => setEditing(false)}
              onSaved={() => setEditing(false)}
            />
          ) : (
            <ProfileDetails profile={data} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
