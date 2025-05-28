import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test the connection by querying the documents table
    const { data, error } = await supabase
      .from("documents")
      .select("count")
      .limit(1);

    if (error) {
      console.error("Database connection error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Test RLS by trying to create a document
    const testDoc = {
      id: "test",
      title: "Test Document",
      user_id: "test_user",
      content: null,
    };

    const { error: insertError } = await supabase
      .from("documents")
      .insert(testDoc)
      .select()
      .single();

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      data,
      insertError: insertError?.message || null,
    });
  } catch (error: Error | unknown) {
    console.error("API route error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 