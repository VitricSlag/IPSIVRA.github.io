import { useState } from "react";
import { Check, ChevronDown, Cpu, Download, AlertTriangle } from "lucide-react";
import {
  MODEL_OPTIONS,
  type EngineStatus,
  type ModelOption,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface ModelPickerProps {
  modelId: string;
  status: EngineStatus;
  disabled?: boolean;
  onSelect: (modelId: string) => void;
}

export function ModelPicker({
  modelId,
  status,
  disabled,
  onSelect,
}: ModelPickerProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const current =
    MODEL_OPTIONS.find((m) => m.id === modelId) ?? MODEL_OPTIONS[0]!;

  const loadingProgress =
    status.kind === "loading" ? Math.round(status.progress.progress * 100) : 0;
  const loadingText =
    status.kind === "loading" ? status.progress.text : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm",
          "hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-colors",
        )}
      >
        <Cpu className="h-4 w-4 opacity-70" />
        <span className="font-mono text-xs">{current.label}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </button>

      {status.kind === "loading" && (
        <div className="absolute left-0 right-0 top-full mt-2 w-[min(28rem,90vw)] rounded-md border bg-card p-3 text-xs shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono">{loadingProgress}%</span>
            <span className="text-muted-foreground truncate ml-2">
              {loadingText}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-[width] duration-200"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>
      )}

      {open && status.kind !== "loading" && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 z-30 mt-2 w-[min(26rem,90vw)] rounded-md border bg-card p-1 shadow-xl">
            {MODEL_OPTIONS.map((opt) => (
              <ModelRow
                key={opt.id}
                option={opt}
                selected={opt.id === modelId}
                onClick={() => {
                  setOpen(false);
                  onSelect(opt.id);
                }}
              />
            ))}
            <div className="mt-1 flex items-start gap-2 border-t px-3 py-2 text-[11px] text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                First load downloads weights from HuggingFace and caches them
                locally. Subsequent loads are offline.
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ModelRow({
  option,
  selected,
  onClick,
}: {
  option: ModelOption;
  selected: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm",
        "hover:bg-accent transition-colors",
      )}
    >
      <div className="mt-0.5">
        {selected ? (
          <Check className="h-4 w-4" />
        ) : (
          <Download className="h-4 w-4 opacity-50" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs">{option.label}</span>
          <span className="font-mono text-[11px] text-muted-foreground">
            ~{option.approxSizeGB.toFixed(1)} GB
          </span>
        </div>
        {option.notes && (
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {option.notes}
          </p>
        )}
      </div>
    </button>
  );
}
