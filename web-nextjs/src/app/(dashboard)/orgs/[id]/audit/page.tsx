"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  History,
  Loader2,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  User,
  Book,
  Settings,
  Users,
} from "lucide-react";
import { auditApi, AuditLog } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";

const ACTION_ICONS: Record<string, any> = {
  "repo.enable": Book,
  "repo.disable": Book,
  "repo.config.update": Settings,
  "member.invite": Users,
  "member.remove": Users,
  "member.role.update": Users,
  "org.sync": History,
};

const ACTION_COLORS: Record<string, string> = {
  "repo.enable": "text-green-600",
  "repo.disable": "text-red-600",
  "member.remove": "text-red-600",
  "member.invite": "text-green-600",
};

export default function AuditLogPage() {
  const params = useParams();
  const orgId = params.id as string;
  const { data: session } = useSession();

  const [actionFilter, setActionFilter] = useState<string>("");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit", orgId, actionFilter, page],
    queryFn: () =>
      auditApi.list(session!.accessToken, orgId, {
        action: actionFilter || undefined,
        page: String(page),
      }),
    enabled: !!session?.accessToken,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b bg-white dark:bg-gray-900 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href={`/orgs/${orgId}`} className="btn-ghost p-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <History className="h-5 w-5 text-gray-400" />
          <h1 className="text-xl font-semibold">Audit Log</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="input w-48"
          >
            <option value="">All Actions</option>
            <option value="repo.enable">Repo Enabled</option>
            <option value="repo.disable">Repo Disabled</option>
            <option value="repo.config.update">Config Updated</option>
            <option value="member.invite">Member Invited</option>
            <option value="member.remove">Member Removed</option>
            <option value="member.role.update">Role Changed</option>
          </select>
        </div>

        {/* Audit Logs */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : logs?.data.length === 0 ? (
          <div className="card p-12 text-center">
            <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No audit logs</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {actionFilter
                ? "Try a different filter."
                : "No actions recorded yet."}
            </p>
          </div>
        ) : (
          <div className="card divide-y">
            {logs?.data.map((log) => {
              const Icon = ACTION_ICONS[log.action] || Settings;
              const colorClass = ACTION_COLORS[log.action] || "text-gray-600";
              const isExpanded = expandedLog === log.id;

              return (
                <div key={log.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <Icon className={cn("h-5 w-5", colorClass)} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            log.actorAvatarUrl ||
                            `https://github.com/${log.actorUsername}.png`
                          }
                          alt={log.actorUsername}
                          className="h-5 w-5 rounded-full"
                        />
                        <span className="font-medium">{log.actorUsername}</span>
                        <span className="text-gray-500">
                          {log.action.replace(".", " ")}
                        </span>
                      </div>
                      {log.entityName && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {log.entityType}: {log.entityName}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(log.createdAt)}
                    </span>
                    <button
                      onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                      className="btn-ghost p-1"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {isExpanded && (log.before || log.after) && (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {log.before && (
                        <div>
                          <p className="text-sm font-medium text-red-600 mb-1">
                            Before
                          </p>
                          <pre className="text-xs bg-red-50 dark:bg-red-900/20 p-3 rounded overflow-auto">
                            {JSON.stringify(log.before, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.after && (
                        <div>
                          <p className="text-sm font-medium text-green-600 mb-1">
                            After
                          </p>
                          <pre className="text-xs bg-green-50 dark:bg-green-900/20 p-3 rounded overflow-auto">
                            {JSON.stringify(log.after, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {logs && logs.pagination.totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {logs.pagination.page} of {logs.pagination.totalPages}
            </span>
            <button
              onClick={() =>
                setPage((p) => Math.min(logs.pagination.totalPages, p + 1))
              }
              disabled={page >= logs.pagination.totalPages}
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
