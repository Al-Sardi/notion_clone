"use client";

import { useEffect, useMemo, useState } from "react";
import { Toolbar } from "@/components/toolbar";
import { Cover } from "@/components/cover";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import { getDocumentById, updateDocument, subscribeToUserDocuments } from "@/lib/supabase/documents";
import { useUser } from "@/hooks/use-user";
import type { Document } from "@/lib/supabase/documents";

interface DocumentIdPageProps {
  params: {
    documentId: string;
  };
}

const DocumentIdPage = ({
  params
}: DocumentIdPageProps) => {
  const { user } = useUser();
  const [document, setDocument] = useState<Document | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const Editor = useMemo(() => dynamic(() => import("@/components/editor"), {
    ssr: false,
    loading: () => <Skeleton className="h-[60vh] w-full" />
  }), []);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const doc = await getDocumentById(params.documentId);
        setDocument(doc as Document);
      } catch (error) {
        console.error("Error fetching document:", error);
        setDocument(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();

    // Set up real-time subscription if we have a user
    if (user?.id) {
      const subscription = subscribeToUserDocuments(user.id, (payload) => {
        if (payload.new?.id === params.documentId) {
          setDocument(payload.new as Document);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [params.documentId, user?.id]);

  const onChange = async (content: string) => {
    try {
      await updateDocument(params.documentId, { content: JSON.parse(content) });
    } catch (error) {
      console.error("Error updating document:", error);
    }
  };

  if (document === undefined || isLoading) {
    return (
      <div>
        <Cover.Skeleton />
        <div className="md:max-w-3xl lg:max-w-4xl mx-auto mt-10">
          <div className="space-y-4 pl-8 pt-4">
            <Skeleton className="h-14 w-[50%]" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[40%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        </div>
      </div>
    );
  }

  if (document === null) {
    return <div>Not found</div>
  }

  return (
    <div className="pb-40">
      <Cover url={document.cover_image || undefined} />
      <div className="md:max-w-3xl lg:max-w-4xl mx-auto">
        <Toolbar initialData={document} />
        <Editor
          onChange={onChange}
          initialContent={document.content ? JSON.stringify(document.content) : undefined}
          editable={true}
        />
      </div>
    </div>
  );
}

export default DocumentIdPage; 