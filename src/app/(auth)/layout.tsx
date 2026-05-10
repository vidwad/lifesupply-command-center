export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-lg font-bold">LS</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">LifeSupply Command Center</h1>
          <p className="text-sm text-muted-foreground">
            Secure management platform — authorized users only.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
