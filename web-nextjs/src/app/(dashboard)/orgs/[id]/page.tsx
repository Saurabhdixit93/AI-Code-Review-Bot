"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Activity,
  Book,
  GitPullRequest,
  Loader2,
  RefreshCw,
  Settings,
  Users,
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { orgsApi, runsApi } from "@/lib/api";
import { cn, formatDate, statusColors, formatNumber } from "@/lib/utils";

export default function OrganizationDashboard() {
  const params = useParams();
  const orgId = params.id as string;
  const { data: session } = useSession();

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ["organization", orgId],
    queryFn: () => orgsApi.get(session!.accessToken, orgId),
    enabled: !!session?.accessToken,
  });

  const { data: recentRuns, isLoading: runsLoading } = useQuery({
    queryKey: ["runs", orgId, "recent"],
    queryFn: () => runsApi.list(session!.accessToken, orgId, { limit: "5" }),
    enabled: !!session?.accessToken,
  });

  if (orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!org) return null;

  const navItems = [
    { href: `/orgs/${orgId}`, icon: Activity, label: "Overview", active: true },
    { href: `/orgs/${orgId}/repos`, icon: Book, label: "Repositories" },
    { href: `/orgs/${orgId}/runs`, icon: GitPullRequest, label: "Runs" },
    { href: `/orgs/${orgId}/members`, icon: Users, label: "Members" },
    { href: `/orgs/${orgId}/audit`, icon: RefreshCw, label: "Audit Log" },
    { href: `/orgs/${orgId}/settings`, icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-900 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href="/orgs" className="btn-ghost p-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          {org.avatarUrl && (
            <img
              src={org.avatarUrl}
              alt={org.name}
              className="h-8 w-8 rounded-lg"
            />
          )}
          <h1 className="text-xl font-semibold">{org.name}</h1>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  item.active
                    ? "text-brand-600 border-brand-600"
                    : "text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Repositories
                </p>
                <p className="text-3xl font-bold">
                  {formatNumber(org.stats.repoCount)}
                </p>
                <p className="text-sm text-green-600">
                  {org.stats.enabledRepoCount} enabled
                </p>
              </div>
              <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
                <Book className="h-6 w-6 text-brand-600" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Runs
                </p>
                <p className="text-3xl font-bold">
                  {formatNumber(org.stats.runCount)}
                </p>
                <p className="text-sm text-gray-500">all time</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <GitPullRequest className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Members
                </p>
                <p className="text-3xl font-bold">
                  {formatNumber(org.stats.memberCount)}
                </p>
                <p className="text-sm text-gray-500">active</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Your Role
                </p>
                <p className="text-3xl font-bold capitalize">{org.role}</p>
                <p className="text-sm text-gray-500">permission level</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link
            href={`/orgs/${orgId}/repos`}
            className="card p-4 hover:border-brand-500 transition-colors"
          >
            <Book className="h-8 w-8 text-brand-600 mb-3" />
            <h3 className="font-semibold">Manage Repositories</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enable or disable code review on repos
            </p>
          </Link>

          <Link
            href={`/orgs/${orgId}/runs`}
            className="card p-4 hover:border-brand-500 transition-colors"
          >
            <GitPullRequest className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold">View Run History</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Browse all analysis runs and findings
            </p>
          </Link>

          <Link
            href={`/orgs/${orgId}/members`}
            className="card p-4 hover:border-brand-500 transition-colors"
          >
            <Users className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="font-semibold">Team Members</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage roles and permissions
            </p>
          </Link>
        </div>

        {/* Recent Runs */}
        <div className="card">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">Recent Runs</h2>
            <Link
              href={`/orgs/${orgId}/runs`}
              className="text-sm text-brand-600 hover:underline"
            >
              View all →
            </Link>
          </div>

          {runsLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : recentRuns?.data.length === 0 ? (
            <div className="p-8 text-center">
              <GitPullRequest className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">
                No runs yet. Enable a repository to get started.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {recentRuns?.data.map((run) => (
                <Link
                  key={run.id}
                  href={`/runs/${run.id}`}
                  className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {run.status === "completed" ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : run.status === "failed" ? (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {run.repoName}{" "}
                      <span className="text-gray-500">#{run.prNumber}</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {run.prTitle}
                    </p>
                  </div>
                  <span className={cn("badge", statusColors[run.status])}>
                    {run.status}
                  </span>
                  <div className="text-right">
                    <p className="font-medium">{run.findingsTotal} findings</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(run.createdAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
