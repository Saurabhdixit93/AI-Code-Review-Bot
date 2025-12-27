"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orgsApi, reposApi, runsApi, membersApi, auditApi } from "@/lib/api";

// Hook for fetching organizations
export function useOrganizations() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ["organizations"],
    queryFn: () => orgsApi.list(session!.accessToken),
    enabled: !!session?.accessToken,
  });
}

// Hook for fetching single organization
export function useOrganization(orgId: string) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ["organization", orgId],
    queryFn: () => orgsApi.get(session!.accessToken, orgId),
    enabled: !!session?.accessToken && !!orgId,
  });
}

// Hook for syncing organization
export function useSyncOrganization(orgId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => orgsApi.sync(session!.accessToken, orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", orgId] });
      queryClient.invalidateQueries({ queryKey: ["repositories", orgId] });
    },
  });
}

// Hook for fetching repositories
export function useRepositories(
  orgId: string,
  params?: {
    enabled?: string;
    search?: string;
    page?: string;
  }
) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ["repositories", orgId, params],
    queryFn: () => reposApi.list(session!.accessToken, orgId, params),
    enabled: !!session?.accessToken && !!orgId,
  });
}

// Hook for toggling repository
export function useToggleRepository(orgId: string) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ repoId, enabled }: { repoId: string; enabled: boolean }) =>
      reposApi.enable(session!.accessToken, repoId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repositories", orgId] });
    },
  });
}

// Hook for fetching runs
export function useRuns(
  orgId: string,
  params?: {
    status?: string;
    repoId?: string;
    page?: string;
  }
) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ["runs", orgId, params],
    queryFn: () => runsApi.list(session!.accessToken, orgId, params),
    enabled: !!session?.accessToken && !!orgId,
  });
}

// Hook for single run
export function useRun(runId: string) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ["run", runId],
    queryFn: () => runsApi.get(session!.accessToken, runId),
    enabled: !!session?.accessToken && !!runId,
  });
}

// Hook for run findings
export function useFindings(
  runId: string,
  params?: {
    severity?: string;
    category?: string;
    source?: string;
  }
) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ["findings", runId, params],
    queryFn: () => runsApi.findings(session!.accessToken, runId, params),
    enabled: !!session?.accessToken && !!runId,
  });
}

// Hook for members
export function useMembers(orgId: string) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ["members", orgId],
    queryFn: () => membersApi.list(session!.accessToken, orgId),
    enabled: !!session?.accessToken && !!orgId,
  });
}

// Hook for audit logs
export function useAuditLogs(
  orgId: string,
  params?: {
    action?: string;
    page?: string;
  }
) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ["audit", orgId, params],
    queryFn: () => auditApi.list(session!.accessToken, orgId, params),
    enabled: !!session?.accessToken && !!orgId,
  });
}
