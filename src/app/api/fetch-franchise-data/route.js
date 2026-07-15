import { Client, Databases, Query } from "node-appwrite";
import { NextResponse } from "next/server";

const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export async function GET(request) {

  try {

    const pendingRes = await databases.listDocuments(
      DATABASE_ID,
      "franchise_requests",
      [
        Query.limit(5000),
        Query.orderDesc("$createdAt")
      ]
    );

    const approvedRes = await databases.listDocuments(
      DATABASE_ID,
      "franchise_approved",
      [
        Query.limit(5000),
        Query.orderDesc("$createdAt")
      ]
    );

    const rejectedRes = await databases.listDocuments(
      DATABASE_ID,
      "franchise_rejected",
      [
        Query.limit(5000),
        Query.orderDesc("$createdAt")
      ]
    );

    return NextResponse.json({
      success: true,
      pending: pendingRes.documents || [],
      approved: approvedRes.documents || [],
      rejected: rejectedRes.documents || []
    });

  } catch (err) {

    console.error("FETCH API ERROR:", err);

    return NextResponse.json({
      success: false,
      error: err.message,
      pending: [],
      approved: [],
      rejected: []
    });

  }

}