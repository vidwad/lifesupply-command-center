import { Bot, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/EmptyState";
import { formatDateTime } from "@/lib/format";

import { RegenerateBriefingButton } from "./RegenerateBriefingButton";

type Props = {
  briefing: {
    output: string;
    createdAt: string;
    modelName: string;
    status: string;
  } | null;
  canRegenerate?: boolean;
};

export function AiBriefingPanel({ briefing, canRegenerate = false }: Props) {
  if (!briefing) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4" /> AI Daily Briefing
          </CardTitle>
          {canRegenerate && <RegenerateBriefingButton />}
        </CardHeader>
        <CardContent className="flex flex-1 items-center">
          <EmptyState
            icon={Bot}
            title="No AI briefings yet"
            description="Once ANTHROPIC_API_KEY is set, click Regenerate to produce a fresh briefing from today's data."
            className="w-full"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-4 w-4" /> AI Daily Briefing
            </CardTitle>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> Generated {formatDateTime(briefing.createdAt)} •{" "}
              {briefing.modelName}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={briefing.status === "approved" ? "success" : "secondary"}>
              {briefing.status}
            </Badge>
            {canRegenerate && <RegenerateBriefingButton />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pt-0">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
          {briefing.output}
        </pre>
      </CardContent>
    </Card>
  );
}
