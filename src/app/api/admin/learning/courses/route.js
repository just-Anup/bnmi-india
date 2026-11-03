
import { ID, Query } from "node-appwrite";
import {
  requireLearningAdmin,
  handleAdminError,
} from "@/lib/appwrite-server";

const DB = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COURSES = "6adef3f10026a9cf84e0";

function makeSlug(value = "") {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validateCourse(body) {
  const title = String(body.title || "").trim();
  const slug = makeSlug(body.slug || title);
  const description = String(body.description || "").trim();
  const category = String(body.category || "").trim();
  const instructorName = String(body.instructorName || "").trim();
  const thumbnailUrl = String(body.thumbnailUrl || "").trim();
  const level = body.level || "Beginner";
  const status = body.status || "draft";
  const price = Number(body.price);

  if (!title || !description || !category || !instructorName || !slug) {
    throw new Error("Please fill in all required fields.");
  }

  if (
    title.length > 255 ||
    slug.length > 255 ||
    description.length > 10000 ||
    category.length > 100 ||
    instructorName.length > 255 ||
    thumbnailUrl.length > 2000
  ) {
    throw new Error("One or more fields exceed the allowed length.");
  }

  if (!Number.isFinite(price) || price < 0 || price > 10000000) {
    throw new Error("Enter a valid course price.");
  }

  if (
    thumbnailUrl &&
    !/^https?:\/\/\S+$/i.test(thumbnailUrl)
  ) {
    throw new Error("Thumbnail must be an HTTP or HTTPS URL.");
  }

  if (!["Beginner", "Intermediate", "Advanced"].includes(level)) {
    throw new Error("Invalid course level.");
  }

  if (!["draft", "published"].includes(status)) {
    throw new Error("Invalid course status.");
  }

  return {
    title,
    slug,
    description,
    category,
    instructorName,
    thumbnailUrl,
    level,
    status,
    price,
  };
}

async function checkSlug(databases, slug, excludeId = null) {
  const result = await databases.listDocuments(DB, COURSES, [
    Query.equal("slug", slug),
    Query.limit(10),
  ]);

  if (result.documents.some((doc) => doc.$id !== excludeId)) {
    throw new Error("This course URL slug already exists.");
  }
}

function handleError(error) {
  if (
    error.message?.startsWith("Please ") ||
    error.message?.startsWith("One or more") ||
    error.message?.startsWith("Enter ") ||
    error.message?.startsWith("Thumbnail ") ||
    error.message?.startsWith("Invalid ") ||
    error.message?.startsWith("This course ")
  ) {
    return Response.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return handleAdminError(error);
}

// GET: List courses
export async function GET(request) {
  try {
    const { databases } = await requireLearningAdmin(request);

    const result = await databases.listDocuments(DB, COURSES, [
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ]);

    return Response.json({
      courses: result.documents,
      total: result.total,
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST: Create a course
export async function POST(request) {
  try {
    const { databases } = await requireLearningAdmin(request);
    const body = await request.json();
    const data = validateCourse(body);

    await checkSlug(databases, data.slug);

    const document = {
      ...data,
    };

    if (data.status === "published") {
      document.publishedAt = new Date().toISOString();
    }

    const course = await databases.createDocument(
      DB,
      COURSES,
      ID.unique(),
      document
    );

    return Response.json({ course }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

// PATCH: Update a course
export async function PATCH(request) {
  try {
    const { databases } = await requireLearningAdmin(request);
    const body = await request.json();

    if (!body.id) {
      return Response.json(
        { error: "Course ID is required." },
        { status: 400 }
      );
    }

    const existing = await databases.getDocument(
      DB,
      COURSES,
      body.id
    );

    const data = validateCourse({
      ...existing,
      ...body,
    });

    await checkSlug(databases, data.slug, body.id);

    const updates = { ...data };

    if (data.status === "published" && !existing.publishedAt) {
      updates.publishedAt = new Date().toISOString();
    }

    const course = await databases.updateDocument(
      DB,
      COURSES,
      body.id,
      updates
    );

    return Response.json({ course });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE: Delete a course
export async function DELETE(request) {
  try {
    const { databases } = await requireLearningAdmin(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { error: "Course ID is required." },
        { status: 400 }
      );
    }

    const existing = await databases.getDocument(DB, COURSES, id);

    if (existing.status === "published") {
      return Response.json(
        { error: "Unpublish the course before deleting it." },
        { status: 400 }
      );
    }

    await databases.deleteDocument(DB, COURSES, id);

    return Response.json({ success: true });
  } catch (error) {
    return handleAdminError(error);
  }
}
