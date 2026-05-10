import { Megaphone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/EmptyState";
import { formatCurrency, formatPercent } from "@/lib/format";

type Campaign = {
  id: string;
  name: string;
  status: string;
  sentCount: number;
  openRate: number | null;
  attributedRevenue: number;
};

type Props = { campaigns: Campaign[] };

export function CampaignSummary({ campaigns }: Props) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Megaphone className="h-4 w-4" /> Recent campaigns
        </CardTitle>
        <CardDescription className="text-xs">
          Most recent sent campaigns and metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        {campaigns.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No campaigns yet"
            description="Connect Mailchimp or schedule a campaign to start tracking performance."
            className="border-0 bg-transparent"
          />
        ) : (
          <ul className="divide-y">
            {campaigns.map((c) => (
              <li key={c.id} className="flex flex-col gap-1 py-3 first:pt-0">
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-sm font-medium">{c.name}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {c.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{c.sentCount.toLocaleString()} sent</span>
                  {c.openRate != null && <span>{formatPercent(c.openRate, 1)} open</span>}
                  <span className="font-medium text-foreground">
                    {formatCurrency(c.attributedRevenue)} attributed
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
