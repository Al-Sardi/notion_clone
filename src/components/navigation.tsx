"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ChevronsLeft, Plus, PlusCircle, Search, Settings, Trash } from "lucide-react";
import { Item } from "./item";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { TrashBox } from "@/components/trash-box";
import { useSearch } from "@/hooks/use-search";
import { useSidebar, useSidebarSync } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";
import { 
  getDocuments, 
  createDocument,
  subscribeToUserDocuments,
  type Document 
} from "@/lib/supabase/documents";
import { UserItem } from "./user-item";
import { DocumentList } from "./document-list";

export const Navigation = () => {
  const search = useSearch();
  const sidebar = useSidebar();
  const router = useRouter();
  const { user } = useUser();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const mainSidebarRef = useRef<HTMLDivElement | null>(null);
  const resizableRef = useRef<HTMLDivElement | null>(null);

  // Use a type assertion here since we know the ref will be properly initialized
  useSidebarSync(mainSidebarRef as React.RefObject<HTMLDivElement>);

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["documents", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        return await getDocuments(user.id);
      } catch (error) {
        console.error("Failed to load documents:", error);
        toast.error("Failed to load documents. Please try again.");
        return [];
      }
    },
    enabled: !!user?.id
  });

  useEffect(() => {
    if (!user?.id) return;

    const subscription = subscribeToUserDocuments(user.id, () => {
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, router]);

  const onCreateDocument = async () => {
    if (!user?.id) return;

    try {
      const document = await createDocument(user.id);
      if (document) {
        router.push(`/documents/${document.id}`);
      }
    } catch (error) {
      toast.error("Failed to create document");
      console.error(error);
    }
  };

  return (
    <>
      <aside
        ref={mainSidebarRef}
        className={cn(
          "group/sidebar h-full bg-secondary dark:bg-[#1F1F1F] overflow-y-auto relative flex flex-col z-50 transition-all duration-300 ease-in-out",
          sidebar.isOpen ? "min-w-[240px]" : "w-[60px]"
        )}
      >
        <div
          role="button"
          onClick={sidebar.onToggle}
          className={cn(
            "h-6 w-6 text-muted-foreground rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600 absolute top-3 right-2 opacity-0 group-hover/sidebar:opacity-100 transition",
            !sidebar.isOpen && "opacity-100"
          )}
        >
          <ChevronsLeft className={cn("h-6 w-6 transition-transform", !sidebar.isOpen && "rotate-180")} />
        </div>
        <div className={cn(
          "flex flex-col gap-y-4 p-3",
          !sidebar.isOpen && "items-center"
        )}>
          <UserItem />
          <Item
            label="Search"
            icon={Search}
            isSearch
            onClick={search.onOpen}
          />
          <Item
            label="Settings"
            icon={Settings}
            onClick={() => router.push("/settings")}
          />
          <Item
            onClick={onCreateDocument}
            label="New page"
            icon={PlusCircle}
          />
        </div>
        <div className={cn(
          "mt-4 flex flex-col gap-y-2 px-3 min-h-[100px]",
          !sidebar.isOpen && "items-center"
        )}>
          <div className="flex-1">
            <DocumentList
              documents={documents}
              level={0}
              onExpand={(id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))}
              expanded={expanded}
            />
          </div>
          <div className="mt-2">
            <Item
              onClick={onCreateDocument}
              icon={Plus}
              label="Add a page"
            />
          </div>
          <Popover>
            <PopoverTrigger className="w-full mt-4">
              <Item label="Trash" icon={Trash} />
            </PopoverTrigger>
            <PopoverContent
              className="p-0 w-72"
              side={sidebar.isOpen ? "right" : "right"}
            >
              <TrashBox />
            </PopoverContent>
          </Popover>
        </div>
        {sidebar.isOpen && (
          <div
            ref={resizableRef}
            onMouseDown={(e) => resizableRef.current && sidebar.onMouseDown(e, { current: resizableRef.current })}
            className="opacity-0 group-hover/sidebar:opacity-100 transition cursor-ew-resize absolute h-full w-1 bg-primary/10 right-0 top-0"
          />
        )}
      </aside>
    </>
  );
}; 