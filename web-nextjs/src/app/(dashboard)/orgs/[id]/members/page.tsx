"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Users,
  Loader2,
  UserPlus,
  MoreVertical,
  Shield,
  Trash2,
  Check,
} from "lucide-react";
import { membersApi, Member } from "@/lib/api";
import { cn, roleColors } from "@/lib/utils";

const ROLES = ["owner", "maintainer", "reviewer", "viewer"] as const;

export default function MembersPage() {
  const params = useParams();
  const orgId = params.id as string;
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [editingMember, setEditingMember] = useState<string | null>(null);

  const { data: members, isLoading } = useQuery({
    queryKey: ["members", orgId],
    queryFn: () => membersApi.list(session!.accessToken, orgId),
    enabled: !!session?.accessToken,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      membersApi.updateRole(session!.accessToken, memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", orgId] });
      setEditingMember(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) =>
      membersApi.remove(session!.accessToken, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", orgId] });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b bg-white dark:bg-gray-900 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href={`/orgs/${orgId}`} className="btn-ghost p-2">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Users className="h-5 w-5 text-gray-400" />
            <h1 className="text-xl font-semibold">Members</h1>
          </div>
          <button className="btn-primary">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Role Descriptions */}
        <div className="card p-4 mb-6">
          <h3 className="font-semibold mb-3">Role Permissions</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30">
                Owner
              </span>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Full access, manage billing
              </p>
            </div>
            <div>
              <span className="badge bg-orange-100 text-orange-700 dark:bg-orange-900/30">
                Maintainer
              </span>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Manage repos, configs
              </p>
            </div>
            <div>
              <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30">
                Reviewer
              </span>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                View runs, suppress findings
              </p>
            </div>
            <div>
              <span className="badge bg-gray-100 text-gray-700 dark:bg-gray-700">
                Viewer
              </span>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Read-only access
              </p>
            </div>
          </div>
        </div>

        {/* Members List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : (
          <div className="card divide-y">
            {members?.map((member) => (
              <div key={member.id} className="p-4 flex items-center gap-4">
                <img
                  src={
                    member.avatarUrl ||
                    `https://github.com/${member.username}.png`
                  }
                  alt={member.username}
                  className="h-10 w-10 rounded-full"
                />
                <div className="flex-1">
                  <p className="font-medium">{member.username}</p>
                  {member.email && (
                    <p className="text-sm text-gray-500">{member.email}</p>
                  )}
                </div>

                {editingMember === member.id ? (
                  <div className="flex items-center gap-2">
                    <select
                      defaultValue={member.role}
                      onChange={(e) =>
                        updateRoleMutation.mutate({
                          memberId: member.id,
                          role: e.target.value,
                        })
                      }
                      className="input py-1"
                      disabled={updateRoleMutation.isPending}
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setEditingMember(null)}
                      className="btn-ghost p-1"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className={cn("badge", roleColors[member.role])}>
                      {member.role}
                    </span>
                    <button
                      onClick={() => setEditingMember(member.id)}
                      className="btn-ghost p-2"
                      title="Change role"
                    >
                      <Shield className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Remove this member?")) {
                          removeMutation.mutate(member.id);
                        }
                      }}
                      disabled={removeMutation.isPending}
                      className="btn-ghost p-2 text-red-500 hover:text-red-600"
                      title="Remove member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
