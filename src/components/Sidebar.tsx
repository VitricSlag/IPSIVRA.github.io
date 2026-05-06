import { MessageSquarePlus, Trash2, X } from "lucide-react";
import type { Conversation } from "@/lib/types";
import { cn, truncate } from "@/lib/utils";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
  isMobile?: boolean;
}

export function Sidebar({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  onClose,
  isMobile,
}: SidebarProps): JSX.Element {
  return (
    <aside className="flex h-full w-72 flex-col border-r bg-card">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-3">
        <button
          type="button"
          onClick={onCreate}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md border",
            "px-3 py-2 text-sm font-medium",
            "hover:bg-accent transition-colors",
          )}
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span>New chat</span>
        </button>
        {isMobile && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 hover:bg-accent"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-2">
        {conversations.length === 0 ? (
          <div className="px-2 py-8 text-center text-xs text-muted-foreground">
            No conversations yet.
          </div>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((c) => (
              <li key={c.id}>
                <ConversationRow
                  conv={c}
                  active={c.id === activeId}
                  onSelect={() => onSelect(c.id)}
                  onDelete={() => onDelete(c.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function ConversationRow({
  conv,
  active,
  onSelect,
  onDelete,
}: {
  conv: Conversation;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}): JSX.Element {
  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm",
        "cursor-pointer hover:bg-accent transition-colors",
        active && "bg-accent",
      )}
      onClick={onSelect}
    >
      <span className="flex-1 truncate text-[13px]">
        {truncate(conv.title || "Untitled", 38)}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (confirm(`Delete "${truncate(conv.title, 30)}"?`)) onDelete();
        }}
        className={cn(
          "rounded p-1 text-muted-foreground",
          "opacity-0 group-hover:opacity-100",
          "hover:bg-background hover:text-destructive transition",
        )}
        aria-label="Delete conversation"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
