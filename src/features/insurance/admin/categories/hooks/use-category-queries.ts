"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useMe } from "@/features/auth/hooks/use-me";
import {
  handleSessionExpiry,
  isAuthActionError,
  isTerminalActionError,
} from "../../../hooks/session-guard";
import {
  getAllCategoriesAction,
  getCategoryAction,
  getRequirementsAction,
} from "../actions";
import {
  ADMIN_CATEGORIES_QUERY_KEY,
  CATEGORY_QUERY_KEY,
  REQUIREMENTS_QUERY_KEY,
} from "./query-keys";

/** Role-gated (S3). */
export function useAllCategories() {
  const queryClient = useQueryClient();
  const meQuery = useMe();
  const enabled = meQuery.data?.role === "Admin";

  const query = useQuery({
    queryKey: ADMIN_CATEGORIES_QUERY_KEY,
    queryFn: async () => {
      const res = await getAllCategoriesAction();
      if (!res.ok) throw res.error;
      return res.data;
    },
    enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: (failureCount, error) =>
      !(isAuthActionError(error) && isTerminalActionError(error)) &&
      failureCount < 1,
  });

  useEffect(() => {
    if (!isAuthActionError(query.error)) return;
    handleSessionExpiry(queryClient, query.error);
  }, [query.error, queryClient]);

  return query;
}

export function useCategory(categoryId: string) {
  const queryClient = useQueryClient();
  const meQuery = useMe();
  const enabled = meQuery.data?.role === "Admin" && categoryId !== "";

  const query = useQuery({
    queryKey: CATEGORY_QUERY_KEY(categoryId),
    queryFn: async () => {
      const res = await getCategoryAction(categoryId);
      if (!res.ok) throw res.error;
      return res.data;
    },
    enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: (failureCount, error) =>
      !(isAuthActionError(error) && isTerminalActionError(error)) &&
      failureCount < 1,
  });

  useEffect(() => {
    if (!isAuthActionError(query.error)) return;
    handleSessionExpiry(queryClient, query.error);
  }, [query.error, queryClient]);

  return query;
}

export function useRequirements(categoryId: string) {
  const meQuery = useMe();
  return useQuery({
    queryKey: REQUIREMENTS_QUERY_KEY(categoryId),
    queryFn: async () => {
      const res = await getRequirementsAction(categoryId);
      if (!res.ok) throw res.error;
      return res.data;
    },
    enabled: meQuery.data?.role === "Admin" && categoryId !== "",
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
