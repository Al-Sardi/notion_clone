"use client";

export default function EnvTest() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify({
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          NODE_ENV: process.env.NODE_ENV,
        }, null, 2)}
      </pre>
    </div>
  );
} 