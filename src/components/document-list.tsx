"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { getDocuments, subscribeToUserDocuments, type Document } from "@/lib/supabase/documents";
import { Item } from "./item";
import { FileIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

interface DocumentListProps {
  level?: number;
  documents: Document[];
  onExpand?: (id: string) => void;
  expanded: Record<string, boolean>;
  parentDocumentId?: string | null;
}

export const DocumentList = ({
  level = 0,
  documents: initialDocuments = [],
  onExpand,
  expanded,
  parentDocumentId = null
}: DocumentListProps) => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(level === 0);
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const params = useParams();
  const router = useRouter();

  // Only load documents at the root level if not provided via props
  useEffect(() => {
    if (level !== 0 || !isUserLoaded) {
      setIsLoading(false);
      return;
    }

    const loadDocuments = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const docs = await getDocuments(user.id);
        setDocuments(docs);
      } catch (error) {
        console.error("Failed to load documents:", error);
        // Don't rethrow to prevent uncaught promise rejections
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, [user?.id, level, isUserLoaded]);

  // Set up real-time subscription only at the root level
  useEffect(() => {
    if (level === 0 && user?.id) {
      const subscription = subscribeToUserDocuments(user.id, (payload) => {
        // Handle real-time updates
        if (payload.eventType === 'INSERT') {
          setDocuments(prev => [...prev, payload.new as Document]);
        } else if (payload.eventType === 'UPDATE') {
          setDocuments(prev => 
            prev.map(doc => doc.id === payload.new.id ? payload.new as Document : doc)
          );
        } else if (payload.eventType === 'DELETE') {
          setDocuments(prev => prev.filter(doc => doc.id !== payload.old.id));
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user?.id, level]);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => doc.parent_id === parentDocumentId);
  }, [documents, parentDocumentId]);

  const onRedirect = (documentId: string) => {
    router.push(`/documents/${documentId}`);
  };

  if (isLoading && level === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredDocuments.length === 0 && level === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-4">
          <p className="text-sm text-muted-foreground text-center mb-4">
            No documents created yet
          </p>
        </div>
      )}
      <div className="space-y-2">
        {filteredDocuments.map((document) => (
          <div key={document.id}>
            <Item
              id={document.id}
              onClick={() => onRedirect(document.id)}
              label={document.title}
              icon={FileIcon}
              documentIcon={document.icon || undefined}
              active={params.documentId === document.id}
              level={level}
              onExpand={() => onExpand?.(document.id)}
              expanded={expanded[document.id]}
            />
            {expanded[document.id] && (
              <DocumentList
                documents={documents}
                level={level + 1}
                onExpand={onExpand}
                expanded={expanded}
                parentDocumentId={document.id}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 