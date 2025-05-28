import { supabase } from "./index";
import { Database } from "./types";
import { v4 as uuidv4 } from "uuid";
import { PostgrestError, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentUpdate = Database["public"]["Tables"]["documents"]["Update"];
export type DocumentInsert = Database["public"]["Tables"]["documents"]["Insert"];

const handleSupabaseError = (error: unknown, operation: string) => {
  if (error instanceof Error) {
    const errorDetails = {
      ...(error as PostgrestError),
      errorMessage: error.message,
      errorName: error.name,
      errorStack: error.stack,
    };
    console.error(`Error in ${operation}:`, errorDetails);
    throw error;
  } else {
    console.error(`Unknown error in ${operation}:`, error);
    throw new Error(`Unknown error in ${operation}`);
  }
};

export const getDocuments = async (userId: string): Promise<Document[]> => {
  try {
    if (!userId) {
      console.warn("No user ID provided to getDocuments");
      return [];
    }

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error in getDocuments:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return [];
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Unexpected error in getDocuments:", error);
    return [];
  }
};

export const createDocument = async (
  userId: string, 
  title: string = "Untitled", 
  parentId: string | null = null
): Promise<Document | null> => {
  try {
    if (!userId) throw new Error("User ID is required");

    const document: DocumentInsert = {
      id: uuidv4(),
      title,
      user_id: userId,
      parent_id: parentId,
      is_archived: false,
      is_published: false,
      content: null,
    };

    const { data, error, status, statusText } = await supabase
      .from("documents")
      .insert(document)
      .select()
      .single();

    if (error) {
      console.error("Failed to create document:", {
        error,
        status,
        statusText,
        document
      });
      throw error;
    }

    return data;
  } catch (error) {
    handleSupabaseError(error, "createDocument");
    return null;
  }
};

export const getDocumentById = async (documentId: string): Promise<Document | null> => {
  try {
    if (!documentId) throw new Error("Document ID is required");

    const { data, error, status, statusText } = await supabase
      .from("documents")
      .select()
      .eq("id", documentId)
      .single();

    if (error) {
      console.error("Failed to get document by ID:", {
        error,
        status,
        statusText,
        documentId
      });
      throw error;
    }

    return data;
  } catch (error) {
    handleSupabaseError(error, "getDocumentById");
    return null;
  }
};

export const updateDocument = async (documentId: string, update: DocumentUpdate): Promise<Document | null> => {
  try {
    if (!documentId) throw new Error("Document ID is required");

    const { data, error, status, statusText } = await supabase
      .from("documents")
      .update({
        ...update,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update document:", {
        error,
        status,
        statusText,
        documentId,
        update
      });
      throw error;
    }

    return data;
  } catch (error) {
    handleSupabaseError(error, "updateDocument");
    return null;
  }
};

export const archiveDocument = async (documentId: string): Promise<Document | null> => {
  return updateDocument(documentId, { is_archived: true });
};

export const restoreDocument = async (documentId: string): Promise<Document | null> => {
  return updateDocument(documentId, { is_archived: false });
};

export const removeDocument = async (documentId: string): Promise<boolean> => {
  try {
    if (!documentId) throw new Error("Document ID is required");

    const { error, status, statusText } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId);

    if (error) {
      console.error("Failed to remove document:", {
        error,
        status,
        statusText,
        documentId
      });
      throw error;
    }

    return true;
  } catch (error) {
    handleSupabaseError(error, "removeDocument");
    return false;
  }
};

export const getArchivedDocuments = async (userId: string): Promise<Document[]> => {
  try {
    if (!userId) throw new Error("User ID is required");

    const { data, error, status, statusText } = await supabase
      .from("documents")
      .select()
      .eq("user_id", userId)
      .eq("is_archived", true)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Failed to get archived documents:", {
        error,
        status,
        statusText,
        userId
      });
      throw error;
    }

    return data || [];
  } catch (error) {
    handleSupabaseError(error, "getArchivedDocuments");
    return [];
  }
};

export const subscribeToUserDocuments = (
  userId: string,
  callback: (payload: RealtimePostgresChangesPayload<Document>) => void
) => {
  if (!userId) throw new Error("User ID is required");

  console.log("Setting up real-time subscription for user:", userId);

  return supabase
    .channel(`user-documents-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "documents",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log("Real-time update received:", payload);
        callback(payload as RealtimePostgresChangesPayload<Document>);
      }
    )
    .subscribe((status) => {
      console.log("Subscription status:", status);
    });
}; 