import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  return count === 1 ? singular : plural || `${singular}s`;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
}

export const severityColors: Record<string, string> = {
  block: "text-red-600 bg-red-100 dark:bg-red-900/30",
  high: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
  medium: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30",
  low: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
};

export const statusColors: Record<string, string> = {
  pending: "text-gray-600 bg-gray-100 dark:bg-gray-800",
  running: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
  completed: "text-green-600 bg-green-100 dark:bg-green-900/30",
  failed: "text-red-600 bg-red-100 dark:bg-red-900/30",
  skipped: "text-gray-500 bg-gray-100 dark:bg-gray-800",
};

export const roleColors: Record<string, string> = {
  owner: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
  maintainer: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
  reviewer: "text-green-600 bg-green-100 dark:bg-green-900/30",
  viewer: "text-gray-600 bg-gray-100 dark:bg-gray-800",
};
