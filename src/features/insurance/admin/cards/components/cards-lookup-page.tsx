// "use client";

// import { useSearchParams } from "next/navigation";
// import { useTranslations } from "next-intl";
// import { useMemo, useState } from "react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Link, useRouter } from "@/i18n/navigation";
// import type { ApplicationStatus } from "../../../types";
// import { usePatientQueue } from "../hooks/use-patient-queue";
// import {
//   parsePatientQueueFilters,
//   patientQueueFiltersToParams,
// } from "../lib/patient-queue-filters";
// import type { EnrichedApplicationDto } from "../types";
// import { PatientTable } from "./patient-table";
// import { PatientTablePagination } from "./patient-table-pagination";
// import { PatientTableToolbar } from "./patient-table-toolbar";

// /**
//  * The Admin cards lookup page. Replaces the patientId text input with a
//  * paginated data table showing all patients from the application queue.
//  * Filter state lives in the URL (?status=&page=&search=) so views are
//  * shareable and the back button works.
//  */
// export default function CardsLookupPage() {
//   const t = useTranslations("admin");
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const filters = parsePatientQueueFilters(searchParams);
//   const [searchQuery, setSearchQuery] = useState(filters.search);

//   const { queueQuery, enabled } = usePatientQueue({
//     ...(filters.status ? { status: filters.status } : {}),
//     page: filters.page,
//   });

//   const navigate = (next: {
//     status?: ApplicationStatus | null;
//     page?: number;
//     search?: string;
//   }) => {
//     const nextStatus =
//       next.status === null
//         ? undefined
//         : next.status !== undefined
//           ? next.status
//           : filters.status;
//     const nextSearch = next.search !== undefined ? next.search : filters.search;
//     router.push(
//       `/dashboard/admin/cards${patientQueueFiltersToParams({
//         status: nextStatus,
//         page: next.page ?? 1,
//         search: nextSearch,
//       })}`,
//     );
//   };

//   const result = queueQuery.data;

//   /**
//    * Backend will enrich queue rows with patientName, nationalId, cardStatus.
//    * Cast here so the table can access those fields — they're optional on
//    * EnrichedApplicationDto so the UI degrades gracefully until the backend
//    * ships.
//    */
//   const enrichedItems = result?.items as EnrichedApplicationDto[] | undefined;

//   /** Client-side filter for patient name / national ID. */
//   const filteredItems = useMemo(() => {
//     if (!enrichedItems) return [];
//     const q = searchQuery.trim().toLowerCase();
//     if (q === "") return enrichedItems;
//     return enrichedItems.filter((item) => {
//       const name = (item.patientName ?? "").toLowerCase();
//       const nid = (item.nationalId ?? "").toLowerCase();
//       return name.includes(q) || nid.includes(q);
//     });
//   }, [enrichedItems, searchQuery]);

//   return (
//     <div className="flex flex-col gap-4">
//       <Card>
//         <CardHeader>
//           <CardTitle>{t("cards.table.title")}</CardTitle>
//           <CardDescription>{t("cards.table.description")}</CardDescription>
//         </CardHeader>
//         <CardContent className="flex flex-col gap-4">
//           <PatientTableToolbar
//             isRefetching={queueQuery.isRefetching}
//             onRefresh={() => void queueQuery.refetch()}
//             onSearchChange={(value) => {
//               setSearchQuery(value);
//               // Sync search to URL on change for shareability.
//               navigate({ search: value });
//             }}
//             onStatusChange={(status) => navigate({ status })}
//             searchQuery={searchQuery}
//             status={filters.status}
//           />

//           {queueQuery.isPending && enabled ? (
//             <div className="flex flex-col gap-2" aria-busy="true">
//               {Array.from({ length: 6 }).map((_, index) => (
//                 <div
//                   // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
//                   key={index}
//                   className="h-10 w-full animate-pulse rounded-md bg-muted"
//                 />
//               ))}
//             </div>
//           ) : queueQuery.isError ? (
//             <div className="flex flex-col items-center gap-2 py-8 text-center">
//               <p className="text-sm text-muted-foreground">
//                 {t("cards.table.error.title")}
//               </p>
//               <button
//                 className="text-sm text-primary underline-offset-4 hover:underline"
//                 onClick={() => void queueQuery.refetch()}
//                 type="button"
//               >
//                 {t("cards.table.error.retry")}
//               </button>
//             </div>
//           ) : filteredItems.length > 0 ? (
//             <PatientTable items={filteredItems} />
//           ) : (
//             <div className="flex flex-col items-center gap-2 py-8 text-center">
//               <p className="text-sm text-muted-foreground">
//                 {filters.status
//                   ? t("cards.table.empty.forStatus", {
//                       status: t(`statuses.${filters.status}`),
//                     })
//                   : t("cards.table.empty.forAll")}
//               </p>
//             </div>
//           )}

//           {result && result.totalCount > 0 ? (
//             <PatientTablePagination
//               onPageChange={(page) => navigate({ page })}
//               page={result.page}
//               totalCount={result.totalCount}
//               totalPages={result.totalPages}
//             />
//           ) : null}

//           <Link
//             className="text-sm text-primary underline-offset-4 hover:underline"
//             href="/dashboard/admin/applications"
//           >
//             {t("home.cards.fromReview")}
//           </Link>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, useRouter } from "@/i18n/navigation";
import type { ApplicationStatus } from "../../../types";
import { usePatientQueue } from "../hooks/use-patient-queue";
import {
  parsePatientQueueFilters,
  patientQueueFiltersToParams,
} from "../lib/patient-queue-filters";
import type { EnrichedApplicationDto } from "../types";
import { PatientTable } from "./patient-table";
import { PatientTablePagination } from "./patient-table-pagination";
import { PatientTableToolbar } from "./patient-table-toolbar";

/**
 * The Admin cards lookup page. Replaces the patientId text input with a
 * paginated data table showing all patients from the application queue.
 * Filter state lives in the URL (?status=&page=&search=) so views are
 * shareable and the back button works.
 */
export default function CardsLookupPage() {
  const t = useTranslations("admin");
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = parsePatientQueueFilters(searchParams);
  const [searchQuery, setSearchQuery] = useState(filters.search);

  const { queueQuery, enabled } = usePatientQueue({
    ...(filters.status ? { status: filters.status } : {}),
    page: filters.page,
  });

  const navigate = (next: {
    status?: ApplicationStatus | null;
    page?: number;
  }) => {
    const nextStatus =
      next.status === null
        ? undefined
        : next.status !== undefined
          ? next.status
          : filters.status;
    router.push(
      `/dashboard/admin/cards${patientQueueFiltersToParams({
        status: nextStatus,
        page: next.page ?? 1,
        search: searchQuery,
      })}`,
    );
  };

  /** Debounced URL sync for search — replace so keystrokes do not stack history. */
  useEffect(() => {
    if (searchQuery === filters.search) return;
    const timeout = setTimeout(() => {
      router.replace(
        `/dashboard/admin/cards${patientQueueFiltersToParams({
          status: filters.status,
          page: 1,
          search: searchQuery,
        })}`,
      );
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, filters.search, filters.status, router]);

  const result = queueQuery.data;

  /**
   * Backend will enrich queue rows with patientName, nationalId, cardStatus.
   * Cast here so the table can access those fields — they're optional on
   * EnrichedApplicationDto so the UI degrades gracefully until the backend
   * ships.
   */
  const enrichedItems = result?.items as EnrichedApplicationDto[] | undefined;

  /** Client-side filter for patient name / national ID. */
  const filteredItems = useMemo(() => {
    if (!enrichedItems) return [];
    const q = searchQuery.trim().toLowerCase();
    if (q === "") return enrichedItems;
    return enrichedItems.filter((item) => {
      const name = (item.patientName ?? "").toLowerCase();
      const nid = (item.nationalId ?? "").toLowerCase();
      return name.includes(q) || nid.includes(q);
    });
  }, [enrichedItems, searchQuery]);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("cards.table.title")}</CardTitle>
          <CardDescription>{t("cards.table.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <PatientTableToolbar
            isRefetching={queueQuery.isRefetching}
            onRefresh={() => void queueQuery.refetch()}
            onSearchChange={setSearchQuery}
            onStatusChange={(status) => navigate({ status })}
            searchQuery={searchQuery}
            status={filters.status}
          />

          {queueQuery.isPending && enabled ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
                  key={index}
                  className="h-10 w-full animate-pulse rounded-md bg-muted"
                />
              ))}
            </div>
          ) : queueQuery.isError ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t("cards.table.error.title")}
              </p>
              <button
                className="text-sm text-primary underline-offset-4 hover:underline"
                onClick={() => void queueQuery.refetch()}
                type="button"
              >
                {t("cards.table.error.retry")}
              </button>
            </div>
          ) : filteredItems.length > 0 ? (
            <PatientTable items={filteredItems} />
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {searchQuery.trim()
                  ? t("cards.table.empty.forSearch", {
                      search: searchQuery.trim(),
                    })
                  : filters.status
                    ? t("cards.table.empty.forStatus", {
                        status: t(`statuses.${filters.status}`),
                      })
                    : t("cards.table.empty.forAll")}
              </p>
            </div>
          )}

          {result && result.totalCount > 0 ? (
            <PatientTablePagination
              onPageChange={(page) => navigate({ page })}
              page={result.page}
              totalCount={result.totalCount}
              totalPages={result.totalPages}
            />
          ) : null}

          <Link
            className="text-sm text-primary underline-offset-4 hover:underline"
            href="/dashboard/admin/applications"
          >
            {t("home.cards.fromReview")}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
