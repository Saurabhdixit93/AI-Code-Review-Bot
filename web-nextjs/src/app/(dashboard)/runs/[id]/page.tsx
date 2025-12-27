"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  GitPullRequest,
  Loader2,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Zap,
  Bug,
  Code,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { runsApi } from "@/lib/api";
import { cn, formatDate, statusColors, severityColors } from "@/lib/utils";

export default function RunDetailPage() {
  const params = useParams();
  const runId = params.id as string;
  const { data: session } = useSession();

  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);

  const { data: run, isLoading } = useQuery({
    queryKey: ["run", runId],
    queryFn: () => runsApi.get(session!.accessToken, runId),
    enabled: !!session?.accessToken,
  });

  const { data: findings } = useQuery({
    queryKey: ["findings", runId, severityFilter, categoryFilter],
    queryFn: () =>
      runsApi.findings(session!.accessToken, runId, {
        severity: severityFilter || undefined,
        category: categoryFilter || undefined,
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

  const categoryIcon = (category: string) => {
    switch (category) {
      case "security":
        return <Shield className="h-4 w-4" />;
      case "bug":
        return <Bug className="h-4 w-4" />;
      case "perf":
        return <Zap className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!run) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b bg-white dark:bg-gray-900 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href={`/orgs/${run.orgId}/runs`} className="btn-ghost p-2">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            {statusIcon(run.status)}
            <div>
              <h1 className="text-xl font-semibold">
                {run.repoName}{" "}
                <span className="text-gray-500">#{run.prNumber}</span>
              </h1>
              <p className="text-sm text-gray-500">{run.prTitle}</p>
            </div>
          </div>
          <a
            href={`https://github.com/${run.repoFullName}/pull/${run.prNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View PR
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-4">
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <span className={cn("badge", statusColors[run.status])}>
              {run.status}
            </span>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500 mb-1">Duration</p>
            <p className="text-xl font-bold">
              {run.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : "-"}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500 mb-1">Findings</p>
            <p className="text-xl font-bold">{run.findingsTotal}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500 mb-1">Analyzed</p>
            <p className="text-xl font-bold">{run.filesAnalyzed || 0} files</p>
          </div>
        </div>

        {run.error && (
          <div className="card p-4 mb-8 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20">
            <h3 className="font-semibold text-red-600 mb-2">Error</h3>
            <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
              {run.error}
            </pre>
          </div>
        )}

        {run.reason && (
          <div className="card p-4 mb-8 border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-900/20">
            <h3 className="font-semibold text-yellow-600 mb-2">Skip Reason</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {run.reason}
            </p>
          </div>
        )}

        {/* Findings */}
        <div className="card">
          <div className="p-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="font-semibold">
              Findings ({findings?.data.length || 0})
            </h2>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="input py-1 text-sm"
              >
                <option value="">All Severities</option>
                <option value="block">Block</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input py-1 text-sm"
              >
                <option value="">All Categories</option>
                <option value="security">Security</option>
                <option value="bug">Bug</option>
                <option value="perf">Performance</option>
                <option value="style">Style</option>
              </select>
            </div>
          </div>

          {!findings || findings.data.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">No issues found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {severityFilter || categoryFilter
                  ? "Try different filters."
                  : "This code looks good!"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {findings.data.map((finding) => (
                <div key={finding.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn("badge", severityColors[finding.severity])}
                    >
                      {finding.severity}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {categoryIcon(finding.category)}
                        <span className="font-medium">{finding.title}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                          {finding.source}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {finding.message}
                      </p>
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                        {finding.filePath}:{finding.lineStart || "?"}
                      </code>
                    </div>
                    <button
                      onClick={() =>
                        setExpandedFinding(
                          expandedFinding === finding.id ? null : finding.id
                        )
                      }
                      className="btn-ghost p-1"
                    >
                      {expandedFinding === finding.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {expandedFinding === finding.id && (
                    <div className="mt-4 space-y-3">
                      {finding.codeSnippet && (
                        <div>
                          <p className="text-sm font-medium mb-1">Code</p>
                          <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                            {finding.codeSnippet}
                          </pre>
                        </div>
                      )}
                      {finding.suggestion && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                          <p className="text-sm text-green-700 dark:text-green-300">
                            💡 <strong>Suggestion:</strong> {finding.suggestion}
                          </p>
                        </div>
                      )}
                      {finding.ruleId && (
                        <p className="text-xs text-gray-500">
                          Rule: {finding.ruleId}
                        </p>
                      )}
                      {finding.aiModel && (
                        <p className="text-xs text-gray-500">
                          AI Model: {finding.aiModel}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
