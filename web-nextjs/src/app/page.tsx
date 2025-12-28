import Link from "next/link";
import {
  GitBranch,
  Shield,
  Zap,
  BarChart,
  CheckCircle,
  Code2,
  Lock,
  Terminal,
  ArrowRight,
  Bot,
  Cpu,
  Workflow,
  Github,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans selection:bg-brand-100 dark:selection:bg-brand-900/30">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md dark:bg-gray-950/80 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="bg-brand-600 p-1.5 rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
              AI Code Review
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-400">
            <Link
              href="#features"
              className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              How it Works
            </Link>
            <Link
              href="#security"
              className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              Security
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden md:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800 transition-all"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-brand-600 border border-transparent rounded-lg shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all shadow-brand-500/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-20 pb-32 lg:pt-32 lg:pb-40 overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-[40rem] bg-gradient-to-b from-brand-50/50 to-transparent dark:from-brand-950/10 pointer-events-none" />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[60rem] h-[60rem] bg-brand-500/10 dark:bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100/50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-medium mb-8 border border-brand-200 dark:border-brand-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              Now updated for GPT-4 Turbo
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 text-gray-900 dark:text-white leading-[1.1]">
              Code Review on <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 bg-clip-text text-transparent">
                Autopilot
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Hybrid static-analysis + AI reasoning platform for GitHub Pull
              Requests. Catch bugs, security vulnerabilities, and performance
              issues before they trigger a PagerDuty alert.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/login"
                className="btn-primary text-base px-8 py-3.5 h-auto w-full sm:w-auto shadow-xl shadow-brand-500/20 hover:shadow-brand-500/30"
              >
                <Github className="mr-2 h-5 w-5" />
                Connect with GitHub
              </Link>
              <Link
                href="#features"
                className="btn-secondary text-base px-8 py-3.5 h-auto w-full sm:w-auto bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm"
              >
                View Documentation
              </Link>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-gray-400 text-sm font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> Free for Open
                Source
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> SOC2
                Compliant
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> 99.9% Uptime
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Stats Section 
      <section className="border-y border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="container mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
           Stat items here 
        </div>
      </section>
      */}

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Enterprise-grade Analysis Engine
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              We combine the speed of static analysis tools like ESLint/Ruff
              with the reasoning capabilities of modern LLMs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<GitBranch className="h-6 w-6 text-brand-600" />}
              title="Seamless Integration"
              description="Installs as a native GitHub App. Reviews appear as inline comments on your Pull Requests automatically."
            />
            <FeatureCard
              icon={<Lock className="h-6 w-6 text-brand-600" />}
              title="Security First"
              description="Detects hardcoded secrets, SQL injection, XSS, and dangerous patterns before they merge."
            />
            <FeatureCard
              icon={<Cpu className="h-6 w-6 text-brand-600" />}
              title="Hybrid Intelligence"
              description="Uses AST parsing for syntax errors and LLMs for logic bugs, ensuring low false positives."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6 text-brand-600" />}
              title="Performance Insights"
              description="Identifies N+1 queries, expensive loops, and memory leaks in your code changes."
            />
            <FeatureCard
              icon={<Bot className="h-6 w-6 text-brand-600" />}
              title="Custom Guidelines"
              description="Teach the AI your specific coding style and architectural patterns via natural language prompts."
            />
            <FeatureCard
              icon={<BarChart className="h-6 w-6 text-brand-600" />}
              title="Execution Traceability"
              description="Every finding is logged with full audit trails. Know exactly why a PR was approved or blocked."
            />
          </div>
        </div>
      </section>

      {/* Deep Dive Section 1 */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
                <Code2 className="h-4 w-4" />
                <span>Deep Context Awareness</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                It understands your code, not just lines.
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Most tools only lint single files. Our engine analyzes the full
                PR context, understanding how changes in one file affect
                dependencies in another.
              </p>

              <ul className="space-y-4">
                {[
                  "Context-aware diff analysis (300 lines surrounding changes)",
                  "Dependency graph traversal for imports",
                  "Smart deduplication of previous comments",
                  "Ignores auto-generated files and vendor directories",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-gray-700 dark:text-gray-300"
                  >
                    <CheckCircle className="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:w-1/2 w-full">
              <div className="bg-gray-900 rounded-xl shadow-2xl p-6 border border-gray-800 font-mono text-sm leading-relaxed text-gray-300 relative overflow-hidden group">
                {/* Decorative header */}
                <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <span className="text-gray-500 text-xs ml-2">
                    diff --git a/api/user.ts b/api/user.ts
                  </span>
                </div>

                {/* Code Content */}
                <div className="opacity-50 blur-[1px] group-hover:blur-0 transition-all duration-500">
                  <div className="text-gray-500">
                    12 export async function getUser(id: string) &#123;
                  </div>
                  <div className="text-gray-500">
                    13 const cacheKey = `user:id`;
                  </div>
                  <div className="text-red-400 bg-red-900/20 -mx-6 px-6 border-l-2 border-red-500/50">
                    - const user = await User.findOne(&#123; _id: id &#125;);
                  </div>
                  <div className="text-green-400 bg-green-900/20 -mx-6 px-6 border-l-2 border-green-500/50">
                    + const user = await User.findById(id).lean();
                  </div>
                  <div className="text-gray-500">15 return user;</div>
                  <div className="text-gray-500">16 &#125;</div>
                </div>

                {/* AI Comment Overlay */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-4 transform scale-100 animate-in fade-in zoom-in duration-500">
                  <div className="flex items-start gap-3">
                    <div className="bg-brand-600 p-1.5 rounded-full">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-xs">
                          AI Reviewer
                        </span>
                        <span className="text-gray-500 text-xs">Just now</span>
                      </div>
                      <p className="text-sm text-gray-200">
                        Great optimization! Using{" "}
                        <code className="bg-gray-700 px-1 rounded">
                          .lean()
                        </code>{" "}
                        returns plain Javascript objects, reducing memory usage
                        by ~10x for read-only operations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Setup in Minutes
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No complex Docker containers to orchestrate. Just install and go.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connector Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-gray-200 via-brand-200 to-gray-200 dark:from-gray-800 dark:via-brand-900 dark:to-gray-800 z-0" />

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white dark:bg-gray-900 border-4 border-brand-100 dark:border-brand-900/50 rounded-full flex items-center justify-center mb-6 shadow-sm group hover:border-brand-500 transition-colors">
                <Github className="h-10 w-10 text-gray-400 group-hover:text-brand-600 transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-2">1. Connect GitHub</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Install our GitHub App on your organization or repositories.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white dark:bg-gray-900 border-4 border-brand-100 dark:border-brand-900/50 rounded-full flex items-center justify-center mb-6 shadow-sm group hover:border-brand-500 transition-colors">
                <Workflow className="h-10 w-10 text-gray-400 group-hover:text-brand-600 transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                2. Configure Guidelines
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Set severity levels and custom prompts for your coding
                standards.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white dark:bg-gray-900 border-4 border-brand-100 dark:border-brand-900/50 rounded-full flex items-center justify-center mb-6 shadow-sm group hover:border-brand-500 transition-colors">
                <CheckCircle className="h-10 w-10 text-gray-400 group-hover:text-brand-600 transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-2">3. Auto-Review</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Open PRs as usual. Receive high-quality feedback instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-600 dark:bg-brand-900">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
        </div>
        <div className="container mx-auto px-6 lg:px-8 relative text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Start reviewing code smarter, today.
          </h2>
          <p className="text-brand-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Stop wasting senior engineering hours on nitpicks. Let the AI handle
            the basics while you focus on architecture.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-4 bg-white text-brand-600 font-bold rounded-lg shadow-xl hover:bg-gray-50 transition-colors text-lg"
            >
              Install Organization App
            </Link>
          </div>
          <p className="mt-6 text-brand-200 text-sm">
            No credit card required for open source repositories.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-950 pt-20 pb-10 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-6 w-6 text-brand-600" />
                <span className="text-xl font-bold">AI Code Review</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs">
                The enterprise standard for automated code quality. Securing 1M+
                lines of code daily.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <Link href="#features" className="hover:text-brand-600">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-brand-600">
                    Integrations
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-brand-600">
                    Security
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-brand-600">
                    Roadmap
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <Link href="#" className="hover:text-brand-600">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-brand-600">
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-brand-600">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-brand-600">
                    Status
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <Link href="#" className="hover:text-brand-600">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-brand-600">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-brand-600">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-brand-600">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © 2024 AI Code Review. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Github className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer" />
              {/* Add more social icons if needed */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent hover:border-brand-200 dark:hover:border-brand-800 transition-all group">
      <div className="mb-4 bg-white dark:bg-gray-800 w-12 h-12 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
