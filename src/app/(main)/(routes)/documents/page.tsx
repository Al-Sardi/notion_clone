"use client";

import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { createDocument, getDocuments } from "@/lib/supabase/documents";
import { DocumentList } from "@/components/document-list";

const DocumentsPage = () => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [hasDocuments, setHasDocuments] = useState(false);

  useEffect(() => {
    const checkDocuments = async () => {
      if (!user?.id) return;
      try {
        const docs = await getDocuments(user.id);
        setHasDocuments(docs && docs.length > 0);
      } catch (error) {
        console.error("Failed to check documents:", error);
      }
    };

    checkDocuments();
  }, [user?.id]);

  const onCreate = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      await toast.promise(
        createDocument(user.id, "Untitled"),
        {
          loading: "Creating a new note...",
          success: "New note created!",
          error: "Failed to create a new note."
        }
      );
      setHasDocuments(true);
    } catch (error) {
      console.error("Failed to create document:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {!hasDocuments ? (
        <div className="h-full flex flex-col items-center justify-center space-y-4">
          <Image
            src="/empty.png"
            height={300}
            width={300}
            alt="Empty"
            className="dark:hidden"
          />
          <Image
            src="/empty-dark.png"
            height={300}
            width={300}
            alt="Empty"
            className="hidden dark:block"
          />
          <h2 className="text-lg font-medium">
            Welcome to {user?.firstName}&apos;s Notion
          </h2>
          <Button onClick={onCreate} disabled={isLoading}>
            <PlusCircle className="h-4 w-4 mr-2" />
            {isLoading ? "Creating..." : "Create a note"}
          </Button>
        </div>
      ) : (
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">Your Documents</h1>
            <Button onClick={onCreate} disabled={isLoading} size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              {isLoading ? "Creating..." : "New note"}
            </Button>
          </div>
          <DocumentList />
        </div>
      )}
    </div>
  );
};

export default DocumentsPage; 