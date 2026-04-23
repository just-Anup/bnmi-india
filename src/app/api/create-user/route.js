import { Client, Users, ID } from "node-appwrite";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    // ❌ Basic validation
    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // ✅ Init Appwrite Admin Client
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const users = new Users(client);

    let userId;

    try {
      // ✅ Try to create new user
      const user = await users.create(
        ID.unique(),
        email,
        null, // name (optional)
        password
      );

      userId = user.$id;

    } catch (err) {
      // 🔥 If user already exists → fetch existing user
      if (err.message.includes("already exists")) {
        const list = await users.list();

        const existingUser = list.users.find(
          (u) => u.email === email
        );

        if (!existingUser) {
          throw new Error("User exists but not found");
        }

        userId = existingUser.$id;

      } else {
        throw err;
      }
    }

    // ✅ Return userId
    return Response.json({
      success: true,
      userId
    });

  } catch (err) {
    console.error("CREATE USER ERROR:", err);

    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}