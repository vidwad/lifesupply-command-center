import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  children: React.ReactNode;
};

/**
 * Lightweight HTML table primitives styled to match shadcn cards. We avoid
 * pulling in TanStack Table for Phase 4 — the lists are small and server-
 * paginated, so plain tables keep the boundary simple.
 */
export function DataTable({ className, children }: Props) {
  return (
    <div className={cn("overflow-x-auto rounded-md border bg-card", className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
      {children}
    </thead>
  );
}

export function TH({
  children,
  className,
  align = "left",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  const alignClass =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return <th className={cn("px-4 py-3 font-medium", alignClass, className)}>{children}</th>;
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y">{children}</tbody>;
}

export function TR({
  children,
  className,
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
}) {
  return (
    <tr
      className={cn(
        "transition-colors",
        href ? "cursor-pointer hover:bg-muted/40" : "hover:bg-muted/20",
        className,
      )}
      data-href={href}
    >
      {children}
    </tr>
  );
}

export function TD({
  children,
  className,
  align = "left",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  const alignClass =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return <td className={cn("px-4 py-3", alignClass, className)}>{children}</td>;
}
