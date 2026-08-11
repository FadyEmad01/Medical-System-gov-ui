"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/features/auth/hooks/use-me";
import { usePathname, useRouter } from "@/i18n/navigation";

type Props = {
  children: React.ReactNode;
};

/**
 * Client-side gate for protected layouts.
 *
 * The proxy already redirects hard navigations when no session cookie exists,
 * so this component mainly handles client-side transitions and surfaces the
 * loading / error states the proxy can't render.
 */
export function AuthGuard({ children }: Props) {
  const t = useTranslations("auth");
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading, isError, refetch, error } = useMe();

  useEffect(() => {
    if (isLoading || isError) return;
    if (user === null) {
      // Pass the current path as ?from= so the login screen can bounce back.
      router.replace({ pathname: "/auth/login", query: { from: pathname } });
    }
  }, [isLoading, isError, user, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-svh flex-col gap-4 p-6" aria-busy="true">
        <span className="sr-only">{t("loadingSession")}</span>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-full max-w-sm" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("sessionError")}</p>
        {typeof error === "object" &&
          error !== null &&
          "kind" in error &&
          (error as { kind?: string }).kind === "server" && (
            <p className="text-xs text-muted-foreground">
              {t("serverUnavailable")}
            </p>
          )}
        <Button type="button" variant="outline" onClick={() => refetch()}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  // user === null → redirect is in flight, render nothing to avoid flashing.
  if (!user) return null;

  return <>{children}</>;
}
