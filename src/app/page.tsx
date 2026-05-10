export default function HomePage() {
  return (
    <main className="container flex min-h-screen flex-col items-center justify-center gap-6 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Phase 0 — Scaffold
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">LifeSupply Command Center</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Secure management platform foundation. Authentication, dashboard shell, and database land
          in Phase 1.
        </p>
      </div>
      <div className="rounded-lg border bg-card px-6 py-4 text-sm text-card-foreground">
        Project scaffold ready. Next:{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">pnpm dev</code>
      </div>
    </main>
  );
}
