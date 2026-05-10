import type {
  ExceptionStatus,
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
  SupplierWorkflowStatus,
} from "@prisma/client";

import { Badge } from "@/components/ui/badge";

type BadgeVariant = "default" | "secondary" | "destructive" | "success" | "warning" | "outline";

const ORDER_STATUS: Record<OrderStatus, { label: string; variant: BadgeVariant }> = {
  received: { label: "Received", variant: "secondary" },
  processing: { label: "Processing", variant: "default" },
  awaiting_supplier: { label: "Awaiting supplier", variant: "warning" },
  in_supplier_queue: { label: "In supplier queue", variant: "warning" },
  awaiting_human_review: { label: "Needs review", variant: "warning" },
  shipped: { label: "Shipped", variant: "secondary" },
  delivered: { label: "Delivered", variant: "success" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  refunded: { label: "Refunded", variant: "destructive" },
};

const PAYMENT_STATUS: Record<PaymentStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: "Pending", variant: "warning" },
  paid: { label: "Paid", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
  refunded: { label: "Refunded", variant: "destructive" },
  partially_refunded: { label: "Partial refund", variant: "warning" },
};

const FULFILLMENT_STATUS: Record<FulfillmentStatus, { label: string; variant: BadgeVariant }> = {
  unfulfilled: { label: "Unfulfilled", variant: "warning" },
  partially_fulfilled: { label: "Partial", variant: "warning" },
  fulfilled: { label: "Fulfilled", variant: "success" },
  returned: { label: "Returned", variant: "destructive" },
};

const SUPPLIER_STATUS: Record<SupplierWorkflowStatus, { label: string; variant: BadgeVariant }> = {
  not_required: { label: "Not required", variant: "outline" },
  pending_assignment: { label: "Pending assignment", variant: "warning" },
  assigned: { label: "Assigned", variant: "secondary" },
  awaiting_confirmation: { label: "Awaiting confirmation", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "secondary" },
  shipped: { label: "Shipped", variant: "secondary" },
  completed: { label: "Completed", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
};

const EXCEPTION_STATUS: Record<ExceptionStatus, { label: string; variant: BadgeVariant }> = {
  none: { label: "None", variant: "outline" },
  flagged: { label: "Flagged", variant: "destructive" },
  in_review: { label: "In review", variant: "warning" },
  resolved: { label: "Resolved", variant: "success" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const cfg = ORDER_STATUS[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const cfg = PAYMENT_STATUS[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function FulfillmentStatusBadge({ status }: { status: FulfillmentStatus }) {
  const cfg = FULFILLMENT_STATUS[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function SupplierStatusBadge({ status }: { status: SupplierWorkflowStatus }) {
  const cfg = SUPPLIER_STATUS[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function ExceptionStatusBadge({ status }: { status: ExceptionStatus }) {
  const cfg = EXCEPTION_STATUS[status];
  if (status === "none") return null;
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
