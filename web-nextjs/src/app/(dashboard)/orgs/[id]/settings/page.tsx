"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Settings,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { orgsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function OrgSettingsPage() {
  const params = useParams();
  const orgId = params.id as string;
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: org, isLoading } = useQuery({
    queryKey: ["organization", orgId],
    queryFn: () => orgsApi.get(session!.accessToken, orgId),
    enabled: !!session?.accessToken,
  });

  const syncMutation = useMutation({
    mutationFn: () => orgsApi.sync(session!.accessToken, orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", orgId] });
      queryClient.invalidateQueries({ queryKey: ["repositories", orgId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => orgsApi.delete(session!.accessToken, orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      router.replace("/orgs");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!org) return null;

  if (org.role !== "owner") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="card p-8 text-center max-w-md">
          <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Only organization owners can access settings.
          </p>
          <Link href={`/orgs/${orgId}`} className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b bg-white dark:bg-gray-900 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href={`/orgs/${orgId}`} className="btn-ghost p-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Settings className="h-5 w-5 text-gray-400" />
          <h1 className="text-xl font-semibold">Organization Settings</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Organization Info */}
        <section className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Organization</h2>
          <div className="flex items-center gap-4">
            {org.avatarUrl && (
              <img
                src={org.avatarUrl}
                alt={org.name}
                className="h-16 w-16 rounded-lg"
              />
            )}
            <div>
              <p className="text-xl font-bold">{org.name}</p>
              <p className="text-gray-500">@{org.slug}</p>
              <p className="text-sm text-gray-500 mt-1">
                Installation ID: {org.installationId}
              </p>
            </div>
          </div>
        </section>

        {/* Repository Sync */}
        <section className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Repository Sync</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Sync repositories from GitHub to update the list of available repos.
          </p>
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="btn-primary"
          >
            {syncMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Repositories
              </>
            )}
          </button>
          {syncMutation.isSuccess && (
            <p className="mt-2 text-green-600 text-sm">✓ Sync completed!</p>
          )}
        </section>

        {/* GitHub App */}
        <section className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">GitHub App</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Manage your GitHub App installation settings directly on GitHub.
          </p>
          <a
            href={`https://github.com/organizations/${org.slug}/settings/installations`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary inline-flex"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Manage on GitHub
          </a>
        </section>

        {/* Danger Zone */}
        <section className="card p-6 border-red-200 dark:border-red-900">
          <h2 className="text-lg font-semibold text-red-600 mb-4">
            Danger Zone
          </h2>

          {!showDeleteConfirm ? (
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Remove this organization from the platform. This will delete all
                associated data including runs, findings, and configuration.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-danger"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Organization
              </button>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <p className="text-red-700 dark:text-red-400 font-medium mb-4">
                ⚠️ This action cannot be undone. All data will be permanently
                deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  className="btn-danger"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Removing...
                    </>
                  ) : (
                    "Yes, Remove Organization"
                  )}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
