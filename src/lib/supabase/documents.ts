import { supabase } from "./index";
import { Database } from "./types";
import { v4 as uuidv4 } from "uuid";
import { PostgrestError, RealtimePostgresChangesPayload, RealtimePostgresChangesFilter, RealtimeChannel, AuthError } from "@supabase/supabase-js";

if (!supabase) {
  const error = new Error("Supabase client is not initialized");
  console.error("Supabase client initialization error:", error);
  throw error;
}

// Helper function to log errors consistently
const logError = (context: string, error: unknown, extra: Record<string, any> = {}) => {
  const errorObj = error as Error | PostgrestError | AuthError;
  const errorDetails = {
    context,
    error: {
      name: errorObj?.name,
      message: errorObj?.message,
      ...(errorObj as any).code && { code: (errorObj as any).code },
      ...(errorObj as any).status && { status: (errorObj as any).status },
    },
    ...extra,
  };
  
  console.error(`[${new Date().toISOString()}] Error in ${context}:`, errorDetails);
  return errorDetails;
};

export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentUpdate = Database["public"]["Tables"]["documents"]["Update"];
export type DocumentInsert = Database["public"]["Tables"]["documents"]["Insert"];

const handleSupabaseError = (error: unknown, operation: string) => {
  const errorDetails = logError(operation, error);
  throw new Error(`Supabase error in ${operation}: ${JSON.stringify(errorDetails, null, 2)}`);
};

// Common configuration for document queries
const documentQueryOptions = {
  count: 'exact' as const,
  head: false,
  // Disable realtime for all document queries
} as const;

interface DocumentQueryResult {
  data: Document[] | null;
  error: Error | null;
}

/**
 * Fetches documents for a specific user
 * @param userId - The ID of the user to fetch documents for
 * @returns Promise<Document[]> - Array of documents or empty array on error
 */
export const getDocuments = async (userId: string): Promise<Document[]> => {
  const context = 'getDocuments';
  const timestamp = new Date().toISOString();
  
  const log = (message: string, data?: any) => {
    console.log(`[${timestamp}] ${context}: ${message}`, data || '');
  };
  
  const logError = (message: string, error?: any) => {
    console.error(`[${timestamp}] ${context}: ${message}`, {
      error: error?.message || error || 'No error details',
      name: error?.name,
      code: error?.code,
      status: error?.status,
      userId,
      timestamp
    });
  };

  // Validate input
  if (!userId) {
    const error = new Error('No user ID provided');
    logError('Validation failed', error);
    return [];
  }

  log(`Fetching documents for user: ${userId}`);
  
  try {
    // First, try to get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // If we can't get the session, try to recover by refreshing it
    if (sessionError || !session) {
      log('No active session found, attempting to recover...', { error: sessionError });
      
      // Try to refresh the session
      const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshedSession.session) {
        logError('Failed to refresh session', refreshError);
        return [];
      }
      
      log('Successfully refreshed session');
    } else {
      log(`Active session found, user ID: ${session.user?.id}`);
    }
    
    // Fetch documents
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (error) {
      logError('Database query failed', error);
      return [];
    }

    if (!data || !Array.isArray(data)) {
      log('No documents found');
      return [];
    }

    log(`Successfully fetched ${data.length} documents`);
    return data;
    
  } catch (error) {
    logError('Unexpected error', error);
    return [];
  }
};

export const createDocument = async (
  userId: string, 
  title: string = "Untitled", 
  parentId: string | null = null
): Promise<Document | null> => {
  const context = 'createDocument';
  const timestamp = new Date().toISOString();
  
  const log = (message: string, data?: any) => {
    console.log(`[${timestamp}] ${context}: ${message}`, data || '');
  };
  
  try {
    log('Starting document creation', { userId, title, parentId });
    
    if (!userId) {
      const error = new Error('No user ID provided');
      logError(context, error);
      throw error;
    }

    // Verify we have a valid session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      log('No active session, attempting to refresh...');
      const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshedSession?.session) {
        log('No active session found, checking authentication state...');
        // Check if we have a user ID but no session - this might be a race condition
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          const error = new Error('No authenticated user found');
          logError(context, error, { sessionError, refreshError });
          throw error;
        }
        
        log('Found user but no active session, continuing with user ID', { userId });
      } else {
        log('Successfully refreshed session');
      }
    }
    
    const documentId = uuidv4();
    const newDocument: DocumentInsert = {
      id: documentId,
      user_id: userId,
      title,
      parent_id: parentId,
      content: JSON.stringify([{ type: 'paragraph', children: [{ text: '' }] }]), // Default empty content
      cover_image: null,
      icon: '📄',
      is_archived: false,
      is_published: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    log('Inserting new document', { documentId, userId });
    
    // First insert the document
    const { data, error } = await supabase
      .from("documents")
      .insert([newDocument])
      .select()
      .single();

    if (error) {
      logError('Failed to insert document', error, { 
        userId, 
        documentId,
        parentId,
        errorCode: error.code,
        errorMessage: error.message
      });
      
      // If it's an auth error, try to refresh the session
      if (error.code === 'PGRST301' || error.code === 'PGRST116') {
        log('Session might be expired, attempting to refresh...');
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError) {
          // Retry the insert after refresh
          const retryResult = await supabase
            .from("documents")
            .insert([newDocument])
            .select()
            .single();
            
          if (!retryResult.error) {
            log('Successfully created document after session refresh', { documentId });
            return retryResult.data as Document;
          }
        }
      }
      
      throw new Error(`Failed to create document: ${error.message}`);
    }

    log('Successfully created document', { documentId });
    return data as Document;
    
  } catch (error) {
    logError(context, error, { 
      userId, 
      parentId,
      timestamp
    });
    throw error; // Re-throw to allow toast to handle the error message
  }
};

export const getDocumentById = async (documentId: string): Promise<Document | null> => {
  try {
    if (!documentId) throw new Error("Document ID is required");

    const { data, error } = await supabase
      .from("documents")
      .select("*", documentQueryOptions)
      .eq("id", documentId)
      .single();

    if (error) {
      console.error("Failed to get document by ID:", {
        error,
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

export const updateDocument = async <T extends DocumentUpdate>(
  documentId: string,
  update: T
): Promise<Document | null> => {
  try {
    if (!documentId) throw new Error("Document ID is required");

    const { data, error } = await supabase
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

    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId);

    if (error) {
      console.error("Failed to remove document:", {
        error,
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

    const { data, error } = await supabase
      .from("documents")
      .select("*", documentQueryOptions)
      .eq("user_id", userId)
      .eq("is_archived", true)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch archived documents:", {
        error,
        userId,
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
): RealtimeChannel => {
  if (!userId) throw new Error("User ID is required");

  console.log("Setting up real-time subscription for user:", userId);

  const channel = supabase.channel(`user-documents-${userId}`);
  
  const subscription = channel
    .on('postgres_changes', 
      {
        event: '*',
        schema: 'public',
        table: 'documents',
        filter: `user_id=eq.${userId}`,
      } as const,
      (payload: RealtimePostgresChangesPayload<Document>) => {
        console.log("Real-time update received:", payload);
        callback(payload);
      }
    )
    .subscribe((status: 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED', err?: Error) => {
      if (err) {
        console.error("Subscription error:", err);
      } else {
        console.log("Subscription status:", status);
      }
    });

  return channel as RealtimeChannel;
}; 