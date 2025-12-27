"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  GitPullRequest,
  Loader2,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { runsApi, Run } from "@/lib/api";
import { cn, formatDate, statusColors } from "@/lib/utils";

export default function RunsPage() {
  const params = useParams();
  const orgId = params.id as string;
  const { data: session } = useSession();

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data: runs, isLoading } = useQuery({
    queryKey: ["runs", orgId, statusFilter, page],
    queryFn: () =>
      runsApi.list(session!.accessToken, orgId, {
        status: statusFilter || undefined,
        page: String(page),
      }),
    enabled: !!session?.accessToken,
  });

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "running":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case "skipped":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b bg-white dark:bg-gray-900 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href={`/orgs/${orgId}`} className="btn-ghost p-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <GitPullRequest className="h-5 w-5 text-gray-400" />
          <h1 className="text-xl font-semibold">Run History</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="input w-40"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>

        {/* Runs List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : runs?.data.length === 0 ? (
          <div className="card p-12 text-center">
            <GitPullRequest className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No runs found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {statusFilter
                ? "Try a different status filter."
                : "No analysis runs yet."}
            </p>
          </div>
        ) : (
          <div className="card divide-y">
            {runs?.data.map((run) => (
              <Link
                key={run.id}
                href={`/runs/${run.id}`}
                className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {statusIcon(run.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{run.repoName}</span>
                    <span className="text-gray-500">#{run.prNumber}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {run.prTitle}
                  </p>
                </div>
                <span className={cn("badge", statusColors[run.status])}>
                  {run.status}
                </span>
                <div className="text-right min-w-[100px]">
                  <p className="font-medium">
                    {run.findingsTotal}{" "}
                    {run.findingsTotal === 1 ? "finding" : "findings"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {run.durationMs
                      ? `${(run.durationMs / 1000).toFixed(1)}s`
                      : "-"}
                  </p>
                </div>
                <div className="text-right min-w-[100px]">
                  <p className="text-sm text-gray-500">
                    {formatDate(run.createdAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {runs && runs.pagination.totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {runs.pagination.page} of {runs.pagination.totalPages}
            </span>
            <button
              onClick={() =>
                setPage((p) => Math.min(runs.pagination.totalPages, p + 1))
              }
              disabled={page >= runs.pagination.totalPages}
              className="btn-secondary"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
