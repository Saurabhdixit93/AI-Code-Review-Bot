"use client";

import { useSession } from "next-auth/react";
import { redirect, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const pathname = usePathname();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  }

  return <>{children}</>;
}
