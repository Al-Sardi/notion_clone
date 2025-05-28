import { NextResponse } from "next/server";

export async function GET() {
  const hasAccessKey = !!process.env.EDGE_STORE_ACCESS_KEY;
  const hasSecretKey = !!process.env.EDGE_STORE_SECRET_KEY;

  return NextResponse.json({
    edgestore: {
      accessKey: hasAccessKey,
      secretKey: hasSecretKey
    }
  });
} 