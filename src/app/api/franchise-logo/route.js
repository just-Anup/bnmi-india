import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return new NextResponse("Missing image URL", {
        status: 400,
      });
    }

    const url = new URL(imageUrl);

    // Allow your Appwrite/custom image domains
    const allowedHosts = [
      "cloud.appwrite.io",
      "appwrite.io",
      "api.bnmiindia.org",
    ];

    const isAllowed = allowedHosts.some((host) =>
      url.hostname === host ||
      url.hostname.endsWith("." + host)
    );

    if (!isAllowed) {
      return new NextResponse(
        "Image domain not allowed",
        {
          status: 403,
        }
      );
    }

    const response = await fetch(imageUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      return new NextResponse(
        `Unable to fetch image: ${response.status}`,
        {
          status: response.status,
        }
      );
    }

    const contentType =
      response.headers.get("content-type") ||
      "image/png";

    const imageBuffer =
      await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control":
          "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error(
      "FRANCHISE LOGO PROXY ERROR:",
      error
    );

    return new NextResponse(
      "Unable to load franchise logo",
      {
        status: 500,
      }
    );
  }
}