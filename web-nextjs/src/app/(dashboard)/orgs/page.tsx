"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Building2, ChevronRight, Loader2, Plus } from "lucide-react";
import { orgsApi, Organization } from "@/lib/api";
import { cn, roleColors } from "@/lib/utils";

export default function OrganizationsPage() {
  const { data: session, status } = useSession();

  console.log("OrganizationsPage: status:", status);
  console.log("OrganizationsPage: accessToken exists:", !!session?.accessToken);

  const { data: orgs, isLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => {
      console.log("OrganizationsPage: Fetching organizations...");
      return orgsApi.list(session!.accessToken);
    },
    enabled: !!session?.accessToken,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b bg-white dark:bg-gray-900 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold">Organizations</h1>
          <a
            href={`https://github.com/apps/${
              process.env.NEXT_PUBLIC_GITHUB_APP_SLUG || "ai-code-app93"
            }/installations/new`}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Organization
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Your Organizations</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Select an organization to manage repositories and view analysis
            runs.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : orgs?.length === 0 ? (
          <div className="card p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No organizations yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Install the GitHub App on your organization to get started.
            </p>
            <a
              href={`https://github.com/apps/${
                process.env.NEXT_PUBLIC_GITHUB_APP_SLUG || "ai-code-app93"
              }/installations/new`}
              className="btn-primary"
            >
              Install GitHub App
            </a>
          </div>
        ) : (
          <div className="grid gap-4">
            {orgs?.map((org) => (
              <Link
                key={org.id}
                href={`/orgs/${org.id}`}
                className="card p-4 flex items-center gap-4 hover:border-brand-500 transition-colors"
              >
                {org.avatarUrl ? (
                  <img
                    src={org.avatarUrl}
                    alt={org.name}
                    className="h-12 w-12 rounded-lg"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-brand-600" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{org.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {org.repoCount || 0} repositories
                  </p>
                </div>
                <span className={cn("badge", roleColors[org.role])}>
                  {org.role}
                </span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
