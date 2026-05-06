import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface SystemPromptEditorProps {
  value: string;
  onSave: (next: string) => void;
}

export function SystemPromptEditor({
  value,
  onSave,
}: SystemPromptEditorProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const dirty = draft !== value;

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <div className="border-b bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2 text-xs"
      >
        <span className="font-mono uppercase tracking-wider text-muted-foreground">
          System prompt
        </span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>
      {open && (
        <div className="space-y-2 px-4 pb-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className={cn(
              "w-full resize-y rounded-md border bg-background px-3 py-2",
              "font-mono text-xs leading-relaxed",
              "focus:outline-none focus:ring-1 focus:ring-ring",
            )}
          />
          <div className="flex justify-end">
            <button
              type="button"
              disabled={!dirty}
              onClick={() => onSave(draft)}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs",
                "hover:bg-accent disabled:opacity-50",
                "disabled:cursor-not-allowed transition-colors",
              )}
            >
              <Save className="h-3 w-3" />
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
