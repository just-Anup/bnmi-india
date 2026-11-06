
import "server-only";

import { Client, ID, Storage } from "node-appwrite";
import {
  requireLearningAdmin,
  handleAdminError,
} from "@/lib/appwrite-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const bucketId = process.env.APPWRITE_LEARNING_VIDEO_BUCKET_ID;

// Initial upload limit: 100 MB per video.
const MAX_FILE_SIZE = 100 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  ".mp4",
  ".webm",
  ".mov",
  ".m4v",
];

export async function POST(request) {
  try {
    // Verify the logged-in admin using the existing helper.
    await requireLearningAdmin(request);

    if (!endpoint || !projectId || !apiKey || !bucketId) {
      return Response.json(
        { error: "Video storage configuration is missing." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("video");

    if (!file || typeof file.arrayBuffer !== "function") {
      return Response.json(
        { error: "Please select a video file." },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return Response.json(
        { error: "The selected video file is empty." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: "Video size must not exceed 100 MB for this upload endpoint." },
        { status: 413 }
      );
    }

    const originalName = file.name || "video.mp4";
    const extension = originalName
      .toLowerCase()
      .slice(originalName.lastIndexOf("."));

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return Response.json(
        { error: "Supported video formats: MP4, WebM, MOV and M4V." },
        { status: 400 }
      );
    }

    // Check the content type as an additional validation.
    if (
      file.type &&
      !file.type.startsWith("video/") &&
      file.type !== "application/octet-stream"
    ) {
      return Response.json(
        { error: "Please upload a valid video file." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);

    const storage = new Storage(client);

    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");

    const uploadedFile = await storage.createFile(
      bucketId,
      ID.unique(),
      InputFile.fromBuffer(buffer, safeName)
    );

    return Response.json(
      {
        success: true,
        fileId: uploadedFile.$id,
        bucketId,
        name: uploadedFile.name,
        mimeType: file.type || "application/octet-stream",
        size: uploadedFile.sizeOriginal,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error.message === "UNAUTHORIZED" ||
      error.message === "FORBIDDEN"
    ) {
      return handleAdminError(error);
    }

    console.error("Learning video upload error:", error);

    return Response.json(
      { error: "Video upload failed. Check the server logs and Appwrite Storage settings." },
      { status: 500 }
    );
  }
}
