import { Download } from "lucide-react";

type Props = {
  href: string;
  label?: string;
};

/**
 * Plain link styled as a button. Uses native browser download via the
 * `Content-Disposition` header set by the API route. No JS required.
 */
export function ExportButton({ href, label = "Export CSV" }: Props) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Download className="h-4 w-4" />
      {label}
    </a>
  );
}
