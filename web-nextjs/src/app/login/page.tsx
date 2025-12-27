"use client";

import { signIn } from "next-auth/react";
import { Github, Shield } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="card p-8 w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-brand-100 dark:bg-brand-900/30 p-4">
            <Shield className="h-12 w-12 text-brand-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Sign in with GitHub to access your organizations and repositories.
        </p>

        <button
          onClick={() => signIn("github", { callbackUrl: "/orgs" })}
          className="btn-primary w-full py-3 text-lg flex items-center justify-center gap-3"
        >
          <Github className="h-5 w-5" />
          Continue with GitHub
        </button>

        <p className="mt-6 text-sm text-gray-500 dark:text-gray-500">
          We only request read access to your profile and email.
        </p>
      </div>
    </div>
  );
}
