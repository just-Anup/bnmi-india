
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_HOSTS = [
  "cloud.appwrite.io",
  "api.bnmiindia.org",
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL missing" },
        { status: 400 }
      );
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid image URL" },
        { status: 400 }
      );
    }

    console.log("PROXY REQUEST HOST:", parsedUrl.hostname);
    console.log("PROXY REQUEST PATH:", parsedUrl.pathname);

    // Allow only known Appwrite hosts
    if (
      parsedUrl.protocol !== "https:" ||
      !ALLOWED_HOSTS.includes(parsedUrl.hostname)
    ) {
      return NextResponse.json(
        {
          error: "Unapproved Appwrite hostname",
          hostname: parsedUrl.hostname,
        },
        { status: 400 }
      );
    }

    // Validate Appwrite storage URL
    const parts = parsedUrl.pathname.split("/");

    const validPath =
      parts.length === 8 &&
      parts[1] === "v1" &&
      parts[2] === "storage" &&
      parts[3] === "buckets" &&
      Boolean(parts[4]) &&
      parts[5] === "files" &&
      Boolean(parts[6]) &&
      parts[7] === "view";

    if (!validPath) {
      return NextResponse.json(
        {
          error: "Invalid Appwrite storage path",
          path: parsedUrl.pathname,
        },
        { status: 400 }
      );
    }

    const response = await fetch(parsedUrl.toString(), {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text();

      console.error("APPWRITE IMAGE ERROR:", {
        status: response.status,
        details,
      });

      return NextResponse.json(
        {
          error: "Appwrite image retrieval failed",
          status: response.status,
          details: details.slice(0, 500),
        },
        { status: response.status }
      );
    }

    const contentType =
      response.headers.get("content-type") || "";

    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid image content type", contentType },
        { status: 415 }
      );
    }

    const buffer = await response.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });

  } catch (error) {
    console.error("LOGO PROXY ERROR:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
