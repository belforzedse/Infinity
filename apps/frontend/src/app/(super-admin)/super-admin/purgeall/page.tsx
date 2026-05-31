"use client";

import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import {
  COMMERCE_PURGE_CONFIRMATION,
  CommercePurgeSummary,
  dryRunCommercePurge,
  executeCommercePurge,
} from "@/services/super-admin/purgeCommerce";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { AlertTriangle, CheckCircle2, Database, RefreshCw, ShieldAlert, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type TabKey = "dry-run" | "delete";

const GROUPS = [
  {
    title: "Orders and checkout",
    uids: [
      "api::order.order",
      "api::order-item.order-item",
      "api::order-log.order-log",
      "api::cart.cart",
      "api::cart-item.cart-item",
      "api::contract.contract",
      "api::contract-log.contract-log",
      "api::contract-transaction.contract-transaction",
    ],
  },
  {
    title: "Products and catalog",
    uids: [
      "api::product.product",
      "api::product-category.product-category",
      "api::product-category-content.product-category-content",
      "api::product-tag.product-tag",
      "api::product-faq.product-faq",
      "api::product-size-helper.product-size-helper",
      "api::product-view.product-view",
      "api::product-like.product-like",
      "api::product-log.product-log",
    ],
  },
  {
    title: "Variations and inventory",
    uids: [
      "api::product-variation.product-variation",
      "api::product-variation-color.product-variation-color",
      "api::product-variation-size.product-variation-size",
      "api::product-variation-model.product-variation-model",
      "api::product-variation-log.product-variation-log",
      "api::product-stock.product-stock",
      "api::product-stock-log.product-stock-log",
    ],
  },
  {
    title: "Reviews and discounts",
    uids: [
      "api::product-review.product-review",
      "api::product-review-like.product-review-like",
      "api::product-review-reply.product-review-reply",
      "api::discount.discount",
      "api::general-discount.general-discount",
    ],
  },
] as const;

const formatCount = (value: number) => new Intl.NumberFormat("en-US").format(value);

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message || "Request failed");
  }
  return "Request failed";
};

function SummaryGroup({
  title,
  uids,
  summary,
  labels,
}: {
  title: string;
  uids: readonly string[];
  summary: Record<string, number>;
  labels?: Record<string, string>;
}) {
  const total = uids.reduce((sum, uid) => sum + Number(summary[uid] || 0), 0);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
          {formatCount(total)}
        </span>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {uids.map((uid) => (
          <div
            key={uid}
            className="flex min-w-0 items-center justify-between gap-3 rounded-md border border-slate-100 px-3 py-2"
          >
            <span className="truncate text-sm text-slate-600" title={uid}>
              {labels?.[uid] || uid}
            </span>
            <span className="shrink-0 text-sm font-semibold text-slate-900">
              {formatCount(summary[uid] || 0)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function CommercePurgePage() {
  const router = useRouter();
  const { user, roleName } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<TabKey>("dry-run");
  const [summary, setSummary] = useState<CommercePurgeSummary | null>(null);
  const [lastResult, setLastResult] = useState<CommercePurgeSummary | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSuperadmin = (roleName || "").trim().toLowerCase() === "superadmin";
  const canDelete = confirmation === COMMERCE_PURGE_CONFIRMATION && !isDeleting;

  const totalRecords = useMemo(() => {
    if (!summary?.summary) return 0;
    return Object.values(summary.summary).reduce((sum, value) => sum + Number(value || 0), 0);
  }, [summary]);

  const refreshDryRun = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await dryRunCommercePurge();
      setSummary(result);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;

    setIsDeleting(true);
    setError(null);
    try {
      const result = await executeCommercePurge(confirmation);
      setLastResult(result);
      setConfirmation("");
      setActiveTab("dry-run");
      await refreshDryRun();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (user && !isSuperadmin) {
      router.replace("/super-admin");
    }
  }, [isSuperadmin, router, user]);

  useEffect(() => {
    if (isSuperadmin) {
      void refreshDryRun();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperadmin]);

  if (!user) {
    return (
      <ContentWrapper title="Commerce data purge">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading admin session...
        </div>
      </ContentWrapper>
    );
  }

  if (!isSuperadmin) {
    return (
      <ContentWrapper title="Commerce data purge">
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm">Superadmin access is required.</p>
        </div>
      </ContentWrapper>
    );
  }

  return (
    <ContentWrapper title="Commerce data purge">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("dry-run")}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                activeTab === "dry-run"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Dry run
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("delete")}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                activeTab === "delete"
                  ? "bg-white text-red-700 shadow-sm"
                  : "text-slate-500 hover:text-red-700"
              }`}
            >
              Delete
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
            <Database className="h-4 w-4" />
            <span>{formatCount(totalRecords)} commerce records</span>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm">
            This tool deletes commerce data and product media attached only to those commerce
            records. Users, auth data, social data, settings, shipping data, payment gateways,
            and unrelated upload files are not deleted.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {lastResult && (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm">
              Purge completed. {formatCount(lastResult.mediaRelations.relationRowsDeleted)} media
              relation rows were removed and{" "}
              {formatCount(lastResult.mediaRelations.physicalFilesDeleted)} product media files were
              deleted. Unrelated upload files were preserved.
            </p>
          </div>
        )}

        {activeTab === "dry-run" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={refreshDryRun}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh dry run
              </button>
            </div>

            {summary ? (
              <>
                <div className="grid gap-4">
                  {GROUPS.map((group) => (
                    <SummaryGroup
                      key={group.title}
                      title={group.title}
                      uids={group.uids}
                      summary={summary.summary}
                      labels={summary.labels}
                    />
                  ))}
                </div>

                <section className="rounded-lg border border-slate-200 bg-white p-4">
                  <h2 className="text-base font-semibold text-slate-900">Media relations</h2>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <div className="rounded-md border border-slate-100 px-3 py-2 text-sm text-slate-600">
                      Relation rows: {formatCount(summary.mediaRelations.relationRowsDeleted)}
                    </div>
                    <div className="rounded-md border border-slate-100 px-3 py-2 text-sm text-slate-600">
                      Product media files to delete: {formatCount(summary.mediaRelations.physicalFilesDeleted)}
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-4">
                  <h2 className="text-base font-semibold text-slate-900">Kept and reviewed data</h2>
                  <div className="mt-3 grid gap-4 lg:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700">Kept</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {summary.kept.join(", ")}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700">Needs confirmation</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {summary.needsConfirmation.join(", ")}
                      </p>
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
                {isLoading ? "Loading dry-run summary..." : "Dry-run summary is not available."}
              </div>
            )}
          </div>
        )}

        {activeTab === "delete" && (
          <div className="space-y-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3 text-red-900">
              <Trash2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <h2 className="text-base font-semibold">Permanent commerce deletion</h2>
                <p className="mt-1 text-sm">
                  Type {COMMERCE_PURGE_CONFIRMATION} to enable deletion. This cannot be undone from the app.
                </p>
              </div>
            </div>

            <input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="w-full rounded-lg border border-red-200 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
              placeholder={COMMERCE_PURGE_CONFIRMATION}
              autoComplete="off"
              spellCheck={false}
            />

            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete commerce data"}
            </button>
          </div>
        )}
      </div>
    </ContentWrapper>
  );
}
