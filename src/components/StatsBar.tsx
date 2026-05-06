import { Activity, Cpu, MessagesSquare } from "lucide-react";

interface StatsBarProps {
  modelLabel: string;
  tokensPerSec: number | undefined;
  totalMessages: number;
  status: string;
}

export function StatsBar({
  modelLabel,
  tokensPerSec,
  totalMessages,
  status,
}: StatsBarProps): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4 border-t bg-card px-4 py-1.5 text-[11px] font-mono text-muted-foreground">
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex items-center gap-1.5 truncate">
          <Cpu className="h-3 w-3" />
          {modelLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <Activity className="h-3 w-3" />
          {tokensPerSec !== undefined
            ? `${tokensPerSec.toFixed(1)} tok/s`
            : "— tok/s"}
        </span>
        <span className="flex items-center gap-1.5">
          <MessagesSquare className="h-3 w-3" />
          {totalMessages} msg
        </span>
      </div>
      <span className="truncate uppercase tracking-wider">{status}</span>
    </div>
  );
}
