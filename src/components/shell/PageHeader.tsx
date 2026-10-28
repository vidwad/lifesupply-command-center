import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, actions, breadcrumb, className }: Props) {
  return (
    <div className={cn("border-b bg-background px-4 py-4 md:px-6 md:py-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {breadcrumb && (
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {breadcrumb}
            </p>
          )}
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && (
          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2 [&>div>div]:flex-wrap [&>div]:flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
