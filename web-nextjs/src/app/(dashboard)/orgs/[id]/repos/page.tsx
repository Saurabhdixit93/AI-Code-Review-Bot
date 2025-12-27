"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Book,
  Check,
  Loader2,
  Search,
  Lock,
  Globe,
  Settings,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { reposApi, Repository } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function RepositoriesPage() {
  const params = useParams();
  const orgId = params.id as string;
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "enabled" | "disabled">("all");

  const { data: repos, isLoading } = useQuery({
    queryKey: ["repositories", orgId, filter, search],
    queryFn: () =>
      reposApi.list(session!.accessToken, orgId, {
        enabled:
          filter === "all"
            ? undefined
            : filter === "enabled"
            ? "true"
            : "false",
        search: search || undefined,
      }),
    enabled: !!session?.accessToken,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ repoId, enabled }: { repoId: string; enabled: boolean }) =>
      reposApi.enable(session!.accessToken, repoId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repositories", orgId] });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b bg-white dark:bg-gray-900 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href={`/orgs/${orgId}`} className="btn-ghost p-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Book className="h-5 w-5 text-gray-400" />
          <h1 className="text-xl font-semibold">Repositories</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "enabled", "disabled"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "btn",
                  filter === f ? "btn-primary" : "btn-secondary"
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Repository List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : repos?.data.length === 0 ? (
          <div className="card p-12 text-center">
            <Book className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">
              No repositories found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {search
                ? "Try a different search term."
                : "Sync repositories from GitHub."}
            </p>
          </div>
        ) : (
          <div className="card divide-y">
            {repos?.data.map((repo) => (
              <div key={repo.id} className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{repo.name}</span>
                    {repo.isPrivate ? (
                      <Lock className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Globe className="h-4 w-4 text-gray-400" />
                    )}
                    {repo.isEnabled && (
                      <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </span>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                      {repo.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-brand-500" />
                        {repo.language}
                      </span>
                    )}
                    <span className="capitalize">{repo.runMode} mode</span>
                  </div>
                </div>

                <Link
                  href={`/orgs/${orgId}/repos/${repo.id}`}
                  className="btn-ghost p-2"
                  title="Settings"
                >
                  <Settings className="h-4 w-4" />
                </Link>

                <button
                  onClick={() =>
                    toggleMutation.mutate({
                      repoId: repo.id,
                      enabled: !repo.isEnabled,
                    })
                  }
                  disabled={toggleMutation.isPending}
                  className={cn(
                    "btn min-w-[100px]",
                    repo.isEnabled ? "btn-primary" : "btn-secondary"
                  )}
                >
                  {toggleMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : repo.isEnabled ? (
                    <>
                      <ToggleRight className="h-4 w-4 mr-1" /> Enabled
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="h-4 w-4 mr-1" /> Enable
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {repos && repos.pagination.total > repos.pagination.limit && (
          <div className="flex justify-center mt-6 gap-2">
            <button className="btn-secondary" disabled>
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {repos.pagination.page} of{" "}
              {Math.ceil(repos.pagination.total / repos.pagination.limit)}
            </span>
            <button className="btn-secondary">Next</button>
          </div>
        )}
      </main>
    </div>
  );
}
