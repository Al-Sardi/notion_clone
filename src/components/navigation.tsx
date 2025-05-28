"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ChevronsLeft, Plus, PlusCircle, Settings, Trash } from "lucide-react";
import { Item } from "./item";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { TrashBox } from "@/components/trash-box";
import { SearchButton } from "./search-button";
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
  const sidebar = useSidebar();
  const router = useRouter();
  const { user } = useUser();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const mainSidebarRef = useRef<HTMLDivElement | null>(null);
  const resizableRef = useRef<HTMLDivElement | null>(null);

  // Use a type assertion here since we know the ref will be properly initialized
  useSidebarSync(mainSidebarRef as React.RefObject<HTMLDivElement>);

  const { data: documents = [], error: documentsError, isLoading } = useQuery<Document[]>({
    queryKey: ["documents", user?.id],
    queryFn: async () => {
      const userId = user?.id;
      if (!userId) {
        console.warn("No user ID available when fetching documents");
        return [];
      }
      
      console.log(`[${new Date().toISOString()}] Fetching documents for user:`, userId);
      
      try {
        const docs = await getDocuments(userId);
        console.log(`[${new Date().toISOString()}] Successfully fetched ${docs.length} documents`);
        return docs;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorDetails = {
          error: errorMessage,
          userId,
          timestamp: new Date().toISOString(),
          stack: error instanceof Error ? error.stack : undefined
        };
        
        console.error("Failed to load documents:", JSON.stringify(errorDetails, null, 2));
        
        // Only show error toast for non-401 errors (handled by auth flow)
        if (!errorMessage.includes('401')) {
          toast.error("Failed to load documents. Please try again.");
        }
        
        return [];
      }
    },
    enabled: !!user?.id,
    retry: (failureCount, error) => {
      // Don't retry on 401 errors (handled by auth flow)
      const isAuthError = error instanceof Error && 
        (error.message.includes('401') || error.message.includes('unauthorized'));
      return !isAuthError && failureCount < 2; // Retry twice on non-auth errors
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Log query state changes
  useEffect(() => {
    if (documentsError) {
      console.error("Documents query error:", documentsError);
    }
    
    if (isLoading) {
      console.log(`[${new Date().toISOString()}] Loading documents...`);
    }
  }, [documentsError, isLoading]);

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
    if (!user?.id) {
      toast.error("Please sign in to create a document");
      return;
    }

    const loadingToast = toast.loading("Creating a new document...");
    
    try {
      // Create the document with a default title
      const document = await createDocument(user.id, "Untitled");
      
      if (!document) {
        throw new Error("Document creation failed - no document returned");
      }
      
      // Update to success state
      toast.dismiss(loadingToast);
      toast.success("Document created!");
      
      // Give the UI a moment to update before navigation
      setTimeout(() => {
        router.push(`/documents/${document.id}`);
      }, 300);
      
    } catch (error) {
      console.error("Error creating document:", error);
      toast.dismiss(loadingToast);
      
      let errorMessage = "Failed to create document";
      if (error instanceof Error) {
        errorMessage = error.message;
        // Clean up error messages for better UX
        if (errorMessage.includes('JWT')) {
          errorMessage = "Session expired. Please refresh the page and try again.";
        } else if (errorMessage.includes('permission')) {
          errorMessage = "You don't have permission to create documents.";
        }
      }
      
      toast.error(errorMessage);
      
      // If it's an auth-related error, suggest a refresh
      if (errorMessage.toLowerCase().includes('auth') || 
          errorMessage.toLowerCase().includes('session') ||
          errorMessage.toLowerCase().includes('jwt')) {
        toast.info("Refreshing page to restore session...");
        setTimeout(() => window.location.reload(), 1500);
      }
    }
  };

  return (
    <>
      <div className="relative flex h-full">
        <aside
          ref={mainSidebarRef}
          className={cn(
            "group/sidebar h-full bg-gray-100 dark:bg-[#171717] overflow-y-auto relative flex flex-col z-50 transition-all duration-300 ease-in-out",
            sidebar.isOpen ? "w-[240px]" : "w-0 opacity-0 overflow-hidden"
          )}
        >
          <div
            role="button"
            onClick={sidebar.onToggle}
            className="h-6 w-6 text-muted-foreground rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600 absolute top-3 right-2 opacity-0 group-hover/sidebar:opacity-100 transition z-50"
          >
            <ChevronsLeft className="h-6 w-6" />
          </div>
        <div className={cn(
          "flex flex-col gap-y-4 p-3",
          !sidebar.isOpen && "items-center"
        )}>
          <UserItem />
          <SearchButton />
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
        <div
          className={cn(
            "absolute left-0 top-3 z-50 transition-transform",
            sidebar.isOpen ? "-translate-x-10" : "translate-x-2"
          )}
        >
          <div
            role="button"
            onClick={sidebar.onToggle}
            className="h-6 w-6 flex items-center justify-center text-muted-foreground rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600 transition"
          >
            <ChevronsLeft className={cn("h-6 w-6 transition-transform", !sidebar.isOpen && "rotate-180")} />
          </div>
        </div>
      </div>
    </>
  );
}; 