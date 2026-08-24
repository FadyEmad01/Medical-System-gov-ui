"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useProfile } from "../../hooks/use-profile";
import { computeProfileCompleteness } from "../../lib/completeness";
import { ProfileDetails, ProfileKeyFacts } from "./profile-details";
import { ProfileEditForm } from "./profile-edit-form";
import { ProfileHeader } from "./profile-header";
import { ProfileError, ProfileLoading } from "./profile-page-states";
import { ProfileStatusRail } from "./profile-status-rail";

export default function ProfilePage() {
  const ti = useTranslations("insurance");
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useProfile();
  const [editing, setEditing] = useState(false);
  const [pendingScrollToForm, setPendingScrollToForm] = useState(false);
  const editFormRef = useRef<HTMLFormElement | null>(null);

  // Deep-linkable active tab: ?tab=details reopens the details tab on reload.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = tabParam === "details" ? "details" : "overview";

  const syncTabToUrl = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = searchParams.get("tab") ?? "overview";
      if (current === next) return;
      if (next === "overview") params.delete("tab");
      else params.set("tab", next);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (!pendingScrollToForm) return;
    const form = editFormRef.current;
    form?.scrollIntoView({ behavior: "smooth", block: "start" });
    setPendingScrollToForm(false);
  }, [pendingScrollToForm]);

  // Entering edit mode swaps the tabs out for the full-width form below;
  // flag a scroll so the form lands in view once it mounts.
  const toggleEditing = () => {
    if (!editing) setPendingScrollToForm(true);
    setEditing((prev) => !prev);
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

  const completeness = computeProfileCompleteness(data);

  return (
    <div className="flex flex-col">
      <ProfileHeader
        profile={data}
        percent={completeness.percent}
        level={completeness.level}
        editing={editing}
        onToggleEditing={toggleEditing}
      />
      {editing ? (
        <div className="px-4 pb-6 md:px-6">
          <ProfileEditForm
            profile={data}
            formRef={editFormRef}
            onCancel={() => setEditing(false)}
            onSaved={() => setEditing(false)}
          />
        </div>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(value) => syncTabToUrl(value)}
          className="gap-0"
        >
          <div className="overflow-x-auto overscroll-x-contain border-y">
            <TabsList
              variant="line"
              className="group-data-horizontal/tabs:h-auto w-max min-w-min justify-start gap-4 rounded-none bg-transparent p-1 px-4"
            >
              <TabsTrigger value="overview" className="flex-none">
                {ti("profile.tabs.overview")}
              </TabsTrigger>
              <TabsTrigger value="details" className="flex-none">
                {ti("profile.tabs.details")}
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent
            value="overview"
            className="grid gap-6 px-4 py-4 md:px-6 lg:grid-cols-[minmax(0,1fr)_auto_18rem]"
          >
            <div className="flex min-w-0 flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold tracking-tight">
                  {ti("profile.title")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {ti("profile.description")}
                </p>
              </div>
              <ProfileKeyFacts profile={data} />
            </div>
            <Separator orientation="vertical" className="hidden lg:block" />
            <ProfileStatusRail profile={data} />
          </TabsContent>
          <TabsContent value="details" className="px-4 py-4 md:px-6">
            <ProfileDetails profile={data} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
