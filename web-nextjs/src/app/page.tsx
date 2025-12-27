import Link from "next/link";
import { GitBranch, Shield, Zap, BarChart } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-950/80 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-brand-600" />
            <span className="text-xl font-bold">AI Code Review</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="btn-primary">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold tracking-tight mb-6 bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
            Enterprise AI Code Review
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Hybrid static-analysis + AI reasoning platform for GitHub Pull
            Requests. Catch bugs, security issues, and performance problems
            before they ship.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login" className="btn-primary text-lg px-8 py-3">
              Connect GitHub
            </Link>
            <Link href="#features" className="btn-secondary text-lg px-8 py-3">
              Learn More
            </Link>
          </div>
        </div>

        {/* Features */}
        <section
          id="features"
          className="mt-32 grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          <div className="card p-6">
            <GitBranch className="h-10 w-10 text-brand-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">GitHub Integration</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Seamless integration with GitHub PRs. Reviews appear as inline
              comments.
            </p>
          </div>
          <div className="card p-6">
            <Shield className="h-10 w-10 text-brand-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Security First</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Detect SQL injection, XSS, hardcoded secrets, and more
              automatically.
            </p>
          </div>
          <div className="card p-6">
            <Zap className="h-10 w-10 text-brand-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">AI + Static Analysis</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Combine deterministic rules with AI reasoning for comprehensive
              coverage.
            </p>
          </div>
          <div className="card p-6">
            <BarChart className="h-10 w-10 text-brand-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Enterprise Dashboard</h3>
            <p className="text-gray-600 dark:text-gray-400">
              RBAC, audit logs, and detailed analytics for your entire
              organization.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t mt-32 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>Enterprise AI Code Review Platform</p>
        </div>
      </footer>
    </div>
  );
}
