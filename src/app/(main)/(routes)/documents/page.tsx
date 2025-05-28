"use client";

import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { createDocument, getDocuments, type Document } from "@/lib/supabase/documents";
import { DocumentList } from "@/components/document-list";

const DocumentsPage = () => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Load documents when user is available
  useEffect(() => {
    const loadDocuments = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const docs = await getDocuments(user.id);
        setDocuments(docs);
      } catch (error) {
        console.error("Failed to load documents:", error);
        toast.error("Failed to load documents");
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, [user?.id]);
  
  const hasDocuments = documents.length > 0;

  const onCreate = async () => {
    console.log("Create button clicked");
    
    if (!user?.id) {
      console.error("No user ID available");
      toast.error("Please sign in to create a note");
      return;
    }
    
    setIsLoading(true);
    const loadingToast = toast.loading("Creating a new note...");
    
    try {
      console.log("Creating document for user:", user.id);
      const newDocument = await createDocument(user.id, "Untitled");
      
      if (!newDocument) {
        throw new Error("Failed to create document - no document returned");
      }
      
      console.log("Document created successfully:", newDocument.id);
      
      // Update the documents list
      setDocuments(currentDocs => [newDocument, ...currentDocs]);
      
      // Update the toast to show success
      toast.dismiss(loadingToast);
      toast.success("New note created!");
      
      // Optionally navigate to the new document
      // router.push(`/documents/${newDocument.id}`);
      
    } catch (error) {
      console.error("Error in onCreate:", error);
      
      let errorMessage = "Failed to create note";
      if (error instanceof Error) {
        errorMessage = error.message;
        // Clean up error messages for better UX
        if (errorMessage.includes('JWT')) {
          errorMessage = "Session expired. Please refresh the page and try again.";
        } else if (errorMessage.includes('permission')) {
          errorMessage = "You don't have permission to create notes.";
        }
      }
      
      toast.dismiss(loadingToast);
      toast.error(errorMessage);
      
      // If it's an auth-related error, suggest a refresh
      if (errorMessage.toLowerCase().includes('auth') || 
          errorMessage.toLowerCase().includes('session') ||
          errorMessage.toLowerCase().includes('jwt')) {
        toast.info("Refreshing page to restore session...");
        setTimeout(() => window.location.reload(), 1500);
      }
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
          <DocumentList 
            documents={documents}
            expanded={expanded}
            onExpand={(id) => setExpanded(prev => ({
              ...prev,
              [id]: !prev[id]
            }))}
          />
        </div>
      )}
    </div>
  );
};

export default DocumentsPage; 