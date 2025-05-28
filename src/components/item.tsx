"use client";

import { ChevronDown, ChevronRight, LucideIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { createDocument } from "@/lib/supabase/documents";

interface ItemProps {
  id?: string;
  documentIcon?: string;
  active?: boolean;
  expanded?: boolean;
  isSearch?: boolean;
  level?: number;
  onExpand?: () => void;
  label: string;
  onClick?: () => void;
  icon: LucideIcon;
}

export const Item = ({
  id,
  label,
  onClick,
  icon: Icon,
  active,
  documentIcon,
  isSearch,
  level = 0,
  onExpand,
  expanded,
}: ItemProps) => {
  const { user } = useUser();
  const router = useRouter();
  const ChevronIcon = expanded ? ChevronDown : ChevronRight;

  const handleExpand = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    event.stopPropagation();
    onExpand?.();
  };

  const onCreate = async (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    event.stopPropagation();
    if (!id || !user?.id) return;

    const promise = createDocument(user.id, "Untitled", id)
      .then((document) => {
        if (!expanded) {
          onExpand?.();
        }
        router.push(`/documents/${document.id}`);
      });

    toast.promise(promise, {
      loading: "Creating a new note...",
      success: "New note created!",
      error: "Failed to create a new note."
    });
  };

  const paddingLeft = level ? `${(level * 12) + 12}px` : "12px";

  return (
    <div
      onClick={onClick}
      role="button"
      style={{ paddingLeft }}
      className={cn(
        "group min-h-[27px] text-sm py-1 pr-3 w-full hover:bg-primary/5 dark:hover:bg-neutral-600 flex items-center text-muted-foreground font-medium",
        active && "bg-primary/5 dark:bg-neutral-600 text-primary"
      )}
    >
      {!!id && (
        <div
          role="button"
          className="h-full rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-500 mr-1"
          onClick={handleExpand}
        >
          <ChevronIcon
            className="h-4 w-4 shrink-0 text-muted-foreground/50"
          />
        </div>
      )}
      {documentIcon ? (
        <div className="shrink-0 mr-2 text-[18px]">
          {documentIcon}
        </div>
      ) : (
        <Icon 
          className={cn(
            "shrink-0 h-[18px] w-[18px] mr-2",
            active ? "text-primary" : "text-muted-foreground"
          )} 
        />
      )}
      <span className={cn(
        "truncate",
        active && "text-primary dark:text-primary-foreground"
      )}>
        {label}
      </span>
      {isSearch && (
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      )}
      {!!id && (
        <div className="ml-auto flex items-center gap-x-2">
          <div
            role="button"
            onClick={onCreate}
            className="opacity-0 group-hover:opacity-100 h-full ml-auto rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-500"
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}
    </div>
  );
};

Item.Skeleton = function ItemSkeleton({ level }: { level?: number }) {
  const paddingLeft = level ? `${(level * 12) + 12}px` : "12px";

  return (
    <div
      style={{ paddingLeft }}
      className="flex gap-x-2 py-[3px]"
    >
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-[30%]" />
    </div>
  );
}; 