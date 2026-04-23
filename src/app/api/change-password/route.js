import { Client, Users } from "node-appwrite";

export async function POST(req) {
  try {
    const { userId, newPassword } = await req.json();

    // ❌ Validation
    if (!userId || !newPassword) {
      return Response.json(
        { error: "userId and newPassword are required" },
        { status: 400 }
      );
    }

    // ✅ Init Appwrite Admin Client
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY); // must have users.write

    const users = new Users(client);

    // ✅ Update password in Auth
    await users.updatePassword(userId, newPassword);

    return Response.json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err);

    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}