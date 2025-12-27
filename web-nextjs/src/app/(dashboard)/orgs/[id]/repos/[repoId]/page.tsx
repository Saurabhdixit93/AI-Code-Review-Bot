"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Loader2, Settings, Save, RotateCcw } from "lucide-react";
import { reposApi, RepoConfig } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function RepoSettingsPage() {
  const params = useParams();
  const repoId = params.repoId as string;
  const orgId = params.id as string;
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const { data: repo, isLoading } = useQuery({
    queryKey: ["repository", repoId],
    queryFn: () => reposApi.get(session!.accessToken, repoId),
    enabled: !!session?.accessToken,
  });

  const [config, setConfig] = useState<Partial<RepoConfig> | null>(null);

  if (repo?.config && !config) {
    setConfig(repo.config);
  }

  const updateMutation = useMutation({
    mutationFn: (newConfig: Partial<RepoConfig>) =>
      reposApi.updateConfig(session!.accessToken, repoId, newConfig),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repository", repoId] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!repo || !config) return null;

  const handleSave = () => {
    if (config) {
      updateMutation.mutate(config);
    }
  };

  const handleReset = () => {
    if (repo.config) {
      setConfig(repo.config);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b bg-white dark:bg-gray-900 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href={`/orgs/${orgId}/repos`} className="btn-ghost p-2">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold">{repo.name}</h1>
              <p className="text-sm text-gray-500">Repository Settings</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleReset} className="btn-ghost">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="btn-primary"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {updateMutation.isSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <p className="text-green-700 dark:text-green-400">
              Settings saved!
            </p>
          </div>
        )}

        {/* Run Mode */}
        <section className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Run Mode</h2>
          <div className="grid grid-cols-3 gap-4">
            {(["active", "shadow", "disabled"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setConfig({ ...config, runMode: mode })}
                className={cn(
                  "p-4 rounded-lg border text-left transition-colors",
                  config.runMode === mode
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-brand-300"
                )}
              >
                <p className="font-medium capitalize">{mode}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {mode === "active" && "Post comments on PRs"}
                  {mode === "shadow" && "Analyze without posting"}
                  {mode === "disabled" && "Skip all analysis"}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Analysis Toggles */}
        <section className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Analysis Settings</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium">Static Analysis</p>
                <p className="text-sm text-gray-500">Run pattern-based rules</p>
              </div>
              <input
                type="checkbox"
                checked={config.enableStatic}
                onChange={(e) =>
                  setConfig({ ...config, enableStatic: e.target.checked })
                }
                className="toggle"
              />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium">AI Review</p>
                <p className="text-sm text-gray-500">
                  Use AI models for analysis
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.enableAi}
                onChange={(e) =>
                  setConfig({ ...config, enableAi: e.target.checked })
                }
                className="toggle"
              />
            </label>
          </div>
        </section>

        {/* Comment Settings */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Comment Settings</h2>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Max Comments per PR
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={config.maxComments}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    maxComments: parseInt(e.target.value),
                  })
                }
                className="input w-32"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Minimum Severity
              </label>
              <select
                value={config.minSeverity}
                onChange={(e) =>
                  setConfig({ ...config, minSeverity: e.target.value })
                }
                className="input w-48"
              >
                <option value="low">Low and above</option>
                <option value="medium">Medium and above</option>
                <option value="high">High and above</option>
                <option value="block">Block only</option>
              </select>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
