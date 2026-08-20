"use client";

import { CircleAlert, CircleCheck, CreditCard, IdCard } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Link, useRouter } from "@/i18n/navigation";
import { isAuthActionError } from "../../../hooks/session-guard";
import { useCardState } from "../../../hooks/use-card";
import { deriveCardState } from "../../../lib/card-status";
import {
  useCategories,
  useCurrentEnrollment,
} from "../../hooks/use-enrollment";
import { CategoryCard } from "./category-card";

const CATEGORY_SKELETONS = [0, 1, 2];

function CategoriesLoading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CATEGORY_SKELETONS.map((skeleton) => (
        <Card key={skeleton}>
          <CardContent className="flex flex-col gap-4 py-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CategoriesError({
  error,
  isRefetching,
  onRetry,
}: {
  error: unknown;
  isRefetching: boolean;
  onRetry: () => void;
}) {
  const ta = useTranslations("auth");
  const t = useTranslations("insurance");

  let message = t("errors.generic");
  if (isAuthActionError(error)) {
    if (error.kind === "unauthorized") {
      // 401: the session is dead — sign in again.
      message = t("errors.sessionExpired");
    } else if (error.kind === "forbidden") {
      // 403: authenticated but lacking permission — the session is fine.
      message = t("errors.forbidden");
    } else if (error.kind === "notFound") {
      message = t("errors.notFound");
    }
  }

  return (
    <Alert variant="destructive">
      <CircleAlert />
      <AlertTitle>{t("card.error.title")}</AlertTitle>
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

function AlreadyHasCardEmpty() {
  const t = useTranslations("insurance");

  return (
    <Empty className="min-h-72 border border-dashed">
      <EmptyHeader>
        <EmptyMedia>
          <div className="relative size-16">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-muted text-foreground">
              <IdCard className="size-8" />
            </span>
            <span className="absolute -bottom-1 -inset-e-1 flex size-6.5 items-center justify-center rounded-full bg-background text-success ring-2 ring-background">
              <CircleCheck className="size-5" />
            </span>
          </div>
        </EmptyMedia>
        <EmptyTitle>{t("categories.alreadyHasCard.title")}</EmptyTitle>
        <EmptyDescription>
          {t("categories.alreadyHasCard.description")}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href="/dashboard/insurance-card">
            <CreditCard data-icon="inline-start" />
            {t("categories.alreadyHasCard.viewCard")}
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export default function CategoriesLandingPage() {
  const t = useTranslations("insurance");
  const router = useRouter();
  const {
    data: categories,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useCategories();
  const { data: currentEnrollment, isLoading: isEnrollmentLoading } =
    useCurrentEnrollment();
  const cardStateQuery = useCardState();
  const cardState = cardStateQuery.data
    ? deriveCardState(
        cardStateQuery.data.status,
        cardStateQuery.data.currentCard,
      )
    : null;
  const hasReadyCard = cardState?.kind === "ready";

  // A patient who already started enrollment is redirected straight to the
  // wizard; the landing page is only for choosing a category.
  useEffect(() => {
    if (!currentEnrollment) return;
    router.replace("/dashboard/insurance/apply");
  }, [currentEnrollment, router]);

  // Wait for enrollment and card queries so the category grid does not flash
  // for a patient who is already enrolled or already has a ready card.
  if (isEnrollmentLoading || currentEnrollment || cardStateQuery.isPending) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (hasReadyCard) {
    return <AlreadyHasCardEmpty />;
  }

  if (isLoading) return <CategoriesLoading />;

  if (isError || !categories) {
    return (
      <CategoriesError
        error={error}
        isRefetching={isRefetching}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("categories.title")}</CardTitle>
          <CardDescription>{t("categories.description")}</CardDescription>
        </CardHeader>
      </Card>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("categories.empty")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}
