"use client";

import { ShieldX } from "lucide-react";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { useMe } from "@/features/auth/hooks/use-me";
import { Link } from "@/i18n/navigation";
import type { UserRole } from "@/types/enums";

type RoleGuardProps = {
  children: React.ReactNode;
};

type GuardedRole = UserRole;

/**
 * Role gate for client pages.
 *
 * UI-only: the backend remains the source of truth for authorization; this
 * guard merely hides content the current role cannot access and points those
 * users back to the dashboard. The dashboard layout's <AuthGuard> already
 * redirects logged-out users, so `user === null` renders nothing here.
 */
export function AdminGuard({ children }: RoleGuardProps) {
  return <RoleGuard allowedRoles={["Admin"]}>{children}</RoleGuard>;
}

export function PatientGuard({ children }: RoleGuardProps) {
  return <RoleGuard allowedRoles={["Patient"]}>{children}</RoleGuard>;
}

/** Admin or Doctor — point-of-care verify + record verification. */
export function StaffGuard({ children }: RoleGuardProps) {
  return <RoleGuard allowedRoles={["Admin", "Doctor"]}>{children}</RoleGuard>;
}

/** Doctor-only Point of Care desk. */
export function DoctorGuard({ children }: RoleGuardProps) {
  return <RoleGuard allowedRoles={["Doctor"]}>{children}</RoleGuard>;
}

function RoleGuard({
  children,
  allowedRoles,
}: RoleGuardProps & { allowedRoles: GuardedRole[] }) {
  const { data: user } = useMe();

  // `useMe` contract: `data === undefined` is still loading, `null` is logged out.
  if (user === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center" aria-busy="true">
        <Spinner className="text-primary" />
      </div>
    );
  }

  if (user === null) return null;

  if (!allowedRoles.includes(user.role)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}

function AccessDenied() {
  const t = useTranslations("common");

  return (
    <Empty>
      <EmptyMedia variant="icon">
        <ShieldX />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>{t("accessDenied.title")}</EmptyTitle>
        <EmptyDescription>{t("accessDenied.description")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild variant="outline">
          <Link href="/dashboard">{t("nav.home")}</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
