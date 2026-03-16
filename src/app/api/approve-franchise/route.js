export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { Client, Users, Databases, ID } from 'node-appwrite'

export async function POST(req) {

  try {

    const { requestId, franchiseData } = await req.json()

    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY)

    const users = new Users(client)
    const databases = new Databases(client)

    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

    console.log("Creating auth user...")

    let newUser = null

    /* 1️⃣ CREATE AUTH USER */

    try {

      newUser = await users.create(
        ID.unique(),
        franchiseData.email,
        franchiseData.password,
        franchiseData.name
      )

    } catch (err) {

      console.log("User already exists, skipping creation")

    }

    console.log("Auth user created:", newUser?.$id)

    /* 2️⃣ SAVE TO APPROVED COLLECTION */

    await databases.createDocument(
      DATABASE_ID,
      "franchise_approved",
      ID.unique(),
      {
        ...franchiseData,
        instituteName: franchiseData.instituteName,
        email: franchiseData.email,
        userId: newUser?.$id || "",
        createdAt: new Date().toISOString()
      }
    )

    /* 3️⃣ DELETE FROM PENDING REQUESTS */

    await databases.deleteDocument(
      DATABASE_ID,
      "franchise_requests",
      requestId
    )

    return NextResponse.json({ success: true })

  } catch (error) {

    console.error("APPROVE ERROR FULL:", error)

    return NextResponse.json({
      success: false,
      error: error.message
    })

  }

}