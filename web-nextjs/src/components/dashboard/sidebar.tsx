"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Book,
  GitPullRequest,
  Users,
  Settings,
  History,
  ChevronDown,
  LogOut,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  orgId: string;
  orgName: string;
  orgAvatar?: string;
}

export function DashboardSidebar({ orgId, orgName, orgAvatar }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { href: `/orgs/${orgId}`, icon: Activity, label: "Overview", exact: true },
    { href: `/orgs/${orgId}/repos`, icon: Book, label: "Repositories" },
    { href: `/orgs/${orgId}/runs`, icon: GitPullRequest, label: "Runs" },
    { href: `/orgs/${orgId}/members`, icon: Users, label: "Members" },
    { href: `/orgs/${orgId}/audit`, icon: History, label: "Audit Log" },
    { href: `/orgs/${orgId}/settings`, icon: Settings, label: "Settings" },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r min-h-screen flex flex-col">
      {/* Org Selector */}
      <div className="p-4 border-b">
        <Link
          href="/orgs"
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {orgAvatar ? (
            <img
              src={orgAvatar}
              alt={orgName}
              className="h-10 w-10 rounded-lg"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-brand-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{orgName}</p>
            <p className="text-xs text-gray-500">Switch organization</p>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive(item.href, item.exact)
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3">
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || ""}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {session?.user?.name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {session?.user?.email}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
