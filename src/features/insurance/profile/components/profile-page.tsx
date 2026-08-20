"use client";

import { Pencil, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProfile } from "../../hooks/use-profile";
import { CompletenessCard } from "./profile-completeness-card";
import { ProfileDetails } from "./profile-details";
import { ProfileEditForm } from "./profile-edit-form";
import { ProfileError, ProfileLoading } from "./profile-page-states";

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
