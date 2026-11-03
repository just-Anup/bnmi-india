import { Client, Databases, Query } from "node-appwrite";

export const dynamic = "force-dynamic";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const apiKey = process.env.APPWRITE_API_KEY;

export async function GET() {
  try {
    if (!endpoint || !projectId || !databaseId || !apiKey) {
      console.error("Public courses API configuration is missing.");

      return Response.json(
        { error: "Course service is not configured." },
        { status: 500 }
      );
    }

    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);

    const databases = new Databases(client);

    const result = await databases.listDocuments(
      databaseId,
      "YOUR_LEARNING_COURSES_COLLECTION_ID",
      [
        Query.equal("status", "published"),
        Query.orderDesc("$createdAt"),
        Query.limit(100),
      ]
    );

    const courses = result.documents.map((course) => ({
      id: course.$id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      category: course.category,
      thumbnailUrl: course.thumbnailUrl || "",
      instructorName: course.instructorName,
      price: course.price,
      level: course.level,
    }));

    return Response.json({ courses });
  } catch (error) {
    console.error("Public courses API error:", error);

    return Response.json(
      { error: "Unable to load courses right now." },
      { status: 500 }
    );
  }
}
