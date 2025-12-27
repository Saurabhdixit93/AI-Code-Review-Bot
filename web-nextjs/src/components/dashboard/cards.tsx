"use client";

import { cn, severityColors, statusColors } from "@/lib/utils";
import { Shield, AlertTriangle, Zap, Code, GitPullRequest } from "lucide-react";

interface FindingCardProps {
  finding: {
    id: string;
    filePath: string;
    lineStart?: number;
    lineEnd?: number;
    source: string;
    category: string;
    severity: string;
    confidence: string;
    title: string;
    message: string;
    suggestion?: string;
    suppressed: boolean;
  };
  onClick?: () => void;
}

export function FindingCard({ finding, onClick }: FindingCardProps) {
  const categoryIcon = () => {
    switch (finding.category) {
      case "security":
        return <Shield className="h-4 w-4" />;
      case "bug":
        return <AlertTriangle className="h-4 w-4" />;
      case "perf":
        return <Zap className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  return (
    <div
      className={cn(
        "p-4 border rounded-lg transition-colors",
        finding.suppressed && "opacity-50",
        onClick && "cursor-pointer hover:border-brand-300"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
            severityColors[finding.severity]
          )}
        >
          {finding.severity}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {categoryIcon()}
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
      </div>
      {finding.suggestion && (
        <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
          <p className="text-green-700 dark:text-green-300">
            💡 {finding.suggestion}
          </p>
        </div>
      )}
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
  icon?: React.ReactNode;
}

export function StatsCard({
  title,
  value,
  description,
  trend,
  icon,
}: StatsCardProps) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg text-brand-600">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span
            className={cn(
              "text-sm font-medium",
              trend.positive ? "text-green-600" : "text-red-600"
            )}
          >
            {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className="text-sm text-gray-500">vs last week</span>
        </div>
      )}
    </div>
  );
}

interface RunStatusBadgeProps {
  status: string;
}

export function RunStatusBadge({ status }: RunStatusBadgeProps) {
  return (
    <span className={cn("badge", statusColors[status] || statusColors.pending)}>
      {status === "running" && <span className="animate-pulse mr-1">●</span>}
      {status}
    </span>
  );
}
