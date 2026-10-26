
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Missing image URL" },
        { status: 400 }
      );
    }

    const parsedUrl = new URL(imageUrl);

    // Allow only your Appwrite storage host.
    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.hostname !== "api.bnmiindia.org" ||
      !/^\/v1\/storage\/buckets\/[^/]+\/files\/[^/]+\/view$/.test(
        parsedUrl.pathname
      )
    ) {
      return NextResponse.json(
        { error: "Invalid image URL" },
        { status: 400 }
      );
    }

    // Fetch server-side, where browser CORS restrictions do not apply.
    const response = await fetch(parsedUrl.toString(), {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to retrieve logo from storage" },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "The requested file is not an image" },
        { status: 415 }
      );
    }

    const imageBuffer = await response.arrayBuffer();

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("LOGO PROXY ERROR:", error);

    return NextResponse.json(
      { error: "Failed to retrieve logo" },
      { status: 500 }
    );
  }
}
