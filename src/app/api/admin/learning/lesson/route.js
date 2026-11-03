
import { ID, Query } from "node-appwrite";
import {
  requireLearningAdmin,
  handleAdminError,
} from "@/lib/appwrite-server";

const DB = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COURSES = "6adef3f10026a9cf84e0";
const LESSONS = "6ae09442000c8307f7bd";

const VIDEO_BUCKET =
  process.env.APPWRITE_LEARNING_VIDEO_BUCKET_ID || "learning_videos";

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isYouTubeUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    return (
      host === "youtube.com" ||
      host.endsWith(".youtube.com") ||
      host === "youtu.be" ||
      host === "youtube-nocookie.com" ||
      host.endsWith(".youtube-nocookie.com")
    );
  } catch {
    return false;
  }
}

function validateLesson(body) {
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const videoUrl = String(body.videoUrl || "").trim();
  const videoFileId = String(body.videoFileId || "").trim();
  const videoBucketId = String(body.videoBucketId || "").trim();

  // Preserve compatibility with older lessons.
  const videoType =
    body.videoType ||
    (videoFileId ? "appwrite" : "url");

  const order = Number(body.order);

  const durationSeconds =
    body.durationSeconds === "" ||
    body.durationSeconds === null ||
    body.durationSeconds === undefined
      ? 0
      : Number(body.durationSeconds);

  if (!body.courseId) {
    throw new Error("Course ID is required.");
  }

  if (!title || title.length > 255) {
    throw new Error("Enter a valid lesson title.");
  }

  if (description.length > 2000) {
    throw new Error("Lesson description is too long.");
  }

  if (!["youtube", "appwrite", "url"].includes(videoType)) {
    throw new Error("Invalid video type.");
  }

  if (videoType === "youtube") {
    if (
      !videoUrl ||
      videoUrl.length > 2000 ||
      !isValidHttpUrl(videoUrl) ||
      !isYouTubeUrl(videoUrl)
    ) {
      throw new Error("Enter a valid YouTube video URL.");
    }
  }

  if (videoType === "appwrite") {
    if (!videoFileId) {
      throw new Error("Please upload a video file first.");
    }

    if (videoFileId.length > 255) {
      throw new Error("Invalid uploaded video file ID.");
    }
  }

  // Legacy external video URLs are retained for older lessons.
  if (videoType === "url") {
    if (
      !videoUrl ||
      videoUrl.length > 2000 ||
      !isValidHttpUrl(videoUrl)
    ) {
      throw new Error("Enter a valid hosted video URL.");
    }
  }

  if (!Number.isInteger(order) || order < 1) {
    throw new Error("Lesson order must be a positive integer.");
  }

  if (
    !Number.isInteger(durationSeconds) ||
    durationSeconds < 0
  ) {
    throw new Error("Enter a valid duration in seconds.");
  }

  if (!["draft", "published"].includes(body.status || "draft")) {
    throw new Error("Invalid lesson status.");
  }

  return {
    courseId: String(body.courseId),
    title,
    description,
    videoType,
    videoUrl: videoType === "appwrite" ? "" : videoUrl,
    videoFileId: videoType === "appwrite" ? videoFileId : "",
    videoBucketId:
      videoType === "appwrite" ? VIDEO_BUCKET : "",
    order,
    durationSeconds,
    isFreePreview: body.isFreePreview === true,
    status: body.status || "draft",
  };
}

function handleValidationError(error) {
  const message = error.message || "";

  if (
    message.includes("required") ||
    message.startsWith("Enter ") ||
    message.startsWith("Lesson ") ||
    message.startsWith("Invalid ") ||
    message.startsWith("Please upload")
  ) {
    return Response.json(
      { error: message },
      { status: 400 }
    );
  }

  return null;
}

// GET: List lessons for a course
export async function GET(request) {
  try {
    const { databases } = await requireLearningAdmin(request);

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return Response.json(
        { error: "Course ID is required." },
        { status: 400 }
      );
    }

    const result = await databases.listDocuments(
      DB,
      LESSONS,
      [
        Query.equal("courseId", courseId),
        Query.orderAsc("order"),
        Query.limit(100),
      ]
    );

    return Response.json({
      lessons: result.documents,
    });
  } catch (error) {
    return handleAdminError(error);
  }
}

// POST: Add a lesson
export async function POST(request) {
  try {
    const { databases } = await requireLearningAdmin(request);

    const body = await request.json();
    const data = validateLesson(body);

    const course = await databases.getDocument(
      DB,
      COURSES,
      data.courseId
    );

    if (course.status !== "draft") {
      return Response.json(
        {
          error: "Unpublish the course before adding lessons.",
        },
        { status: 400 }
      );
    }

    const existing = await databases.listDocuments(
      DB,
      LESSONS,
      [
        Query.equal("courseId", data.courseId),
        Query.limit(100),
      ]
    );

    if (
      existing.documents.some(
        (lesson) => lesson.order === data.order
      )
    ) {
      return Response.json(
        { error: "That lesson order is already in use." },
        { status: 409 }
      );
    }

    if (
      data.isFreePreview &&
      existing.documents.some(
        (lesson) => lesson.isFreePreview
      )
    ) {
      return Response.json(
        { error: "Only one lesson can be the free preview." },
        { status: 409 }
      );
    }

    const lesson = await databases.createDocument(
      DB,
      LESSONS,
      ID.unique(),
      data
    );

    return Response.json(
      { lesson },
      { status: 201 }
    );
  } catch (error) {
    return (
      handleValidationError(error) ||
      handleAdminError(error)
    );
  }
}

// PATCH: Edit a lesson
export async function PATCH(request) {
  try {
    const { databases } = await requireLearningAdmin(request);

    const body = await request.json();

    if (!body.id) {
      return Response.json(
        { error: "Lesson ID is required." },
        { status: 400 }
      );
    }

    const oldLesson = await databases.getDocument(
      DB,
      LESSONS,
      body.id
    );

    const course = await databases.getDocument(
      DB,
      COURSES,
      oldLesson.courseId
    );

    if (course.status !== "draft") {
      return Response.json(
        {
          error: "Unpublish the course before editing lessons.",
        },
        { status: 400 }
      );
    }

    const data = validateLesson({
      ...oldLesson,
      ...body,
      courseId: oldLesson.courseId,
    });

    const siblings = await databases.listDocuments(
      DB,
      LESSONS,
      [
        Query.equal("courseId", oldLesson.courseId),
        Query.limit(100),
      ]
    );

    if (
      siblings.documents.some(
        (lesson) =>
          lesson.$id !== body.id &&
          lesson.order === data.order
      )
    ) {
      return Response.json(
        { error: "That lesson order is already in use." },
        { status: 409 }
      );
    }

    if (
      data.isFreePreview &&
      siblings.documents.some(
        (lesson) =>
          lesson.$id !== body.id &&
          lesson.isFreePreview
      )
    ) {
      return Response.json(
        { error: "Only one lesson can be the free preview." },
        { status: 409 }
      );
    }

    const lesson = await databases.updateDocument(
      DB,
      LESSONS,
      body.id,
      data
    );

    return Response.json({ lesson });
  } catch (error) {
    return (
      handleValidationError(error) ||
      handleAdminError(error)
    );
  }
}

// DELETE: Delete a lesson
export async function DELETE(request) {
  try {
    const { databases } = await requireLearningAdmin(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { error: "Lesson ID is required." },
        { status: 400 }
      );
    }

    const lesson = await databases.getDocument(
      DB,
      LESSONS,
      id
    );

    const course = await databases.getDocument(
      DB,
      COURSES,
      lesson.courseId
    );

    if (course.status !== "draft") {
      return Response.json(
        {
          error: "Unpublish the course before deleting lessons.",
        },
        { status: 400 }
      );
    }

    await databases.deleteDocument(DB, LESSONS, id);

    return Response.json({ success: true });
  } catch (error) {
    return handleAdminError(error);
  }
}
