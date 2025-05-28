import { useUser } from "@clerk/nextjs";


import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Spinner } from "./spinner";
import { ConfirmModal } from "./modals/confirm-modal";
import { Input } from "./ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { getArchivedDocuments, restoreDocument, removeDocument } from "@/lib/supabase/documents";

export const TrashBox = () => {
  const { user } = useUser();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data: documents, isLoading } = useQuery({
    queryKey: ["archived", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await getArchivedDocuments(user.id) || [];
    }
  });

  const filteredDocuments = documents?.filter((document) => {
    return document.title.toLowerCase().includes(search.toLowerCase());
  });

  const onClick = (documentId: string) => {
    router.push(`/documents/${documentId}`);
  };

  const onRestore = async (documentId: string) => {
    try {
      await restoreDocument(documentId);
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  };

  const onRemove = async (documentId: string) => {
    try {
      await removeDocument(documentId);
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="text-sm">
      <div className="flex items-center gap-x-1 p-2">
        <Search className="h-4 w-4" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-7 px-2 focus-visible:ring-transparent bg-secondary"
          placeholder="Filter by page title..."
        />
      </div>
      <div className="mt-2 px-1 pb-1">
        <p className="hidden last:block text-xs text-center text-muted-foreground pb-2">
          No documents found.
        </p>
        {filteredDocuments?.map((document) => (
          <div
            key={document.id}
            role="button"
            onClick={() => onClick(document.id)}
            className="text-sm rounded-sm w-full hover:bg-primary/5 flex items-center text-primary justify-between"
          >
            <span className="truncate pl-2">
              {document.title}
            </span>
            <div className="flex items-center">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onRestore(document.id);
                }}
                role="button"
                className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600"
              >
                Restore
              </div>
              <ConfirmModal onConfirm={() => onRemove(document.id)}>
                <div
                  role="button"
                  className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                >
                  Delete
                </div>
              </ConfirmModal>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 