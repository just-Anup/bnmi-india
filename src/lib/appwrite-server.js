
import "server-only";
import { Client, Account, Databases } from "node-appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

export async function requireLearningAdmin(request) {
  if (!endpoint || !projectId || !apiKey) {
    throw new Error("Server Appwrite configuration is missing.");
  }

  const jwt = request.headers.get("x-appwrite-jwt");

  if (!jwt) {
    throw new Error("UNAUTHORIZED");
  }

  // Verify the user's actual Appwrite identity.
  const authClient = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setJWT(jwt);

  const account = new Account(authClient);
  const user = await account.get();

  const adminEmail = (
    process.env.APPWRITE_ADMIN_EMAIL || ""
  ).trim().toLowerCase();

  if (
    !adminEmail ||
    !user.email ||
    user.email.toLowerCase() !== adminEmail ||
    !user.emailVerification
  ) {
    throw new Error("FORBIDDEN");
  }

  const serverClient = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  return {
    user,
    databases: new Databases(serverClient),
  };
}

export function handleAdminError(error) {
  if (error.message === "UNAUTHORIZED") {
    return Response.json(
      { error: "Please log in again." },
      { status: 401 }
    );
  }

  if (error.message === "FORBIDDEN") {
    return Response.json(
      { error: "You are not authorized to manage courses." },
      { status: 403 }
    );
  }

  console.error("Learning admin API error:", error);

  return Response.json(
    { error: "The operation failed. Check your server logs." },
    { status: 500 }
  );
}
