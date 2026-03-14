export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { Client, Users, Databases, ID, Query } from 'node-appwrite'

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

    let userId = null

    /* 1️⃣ CREATE OR FIND AUTH USER */

    try {

      const newUser = await users.create(
        ID.unique(),
        franchiseData.email,
        franchiseData.password,
        franchiseData.name
      )

      userId = newUser.$id

    } catch (err) {

      console.log("User already exists, fetching userId")

      const existingUsers = await users.list([
        Query.equal('email', franchiseData.email)
      ])

      if (existingUsers.total > 0) {
        userId = existingUsers.users[0].$id
      }

    }

    /* 2️⃣ SAVE APPROVED FRANCHISE */

    await databases.createDocument(
      DATABASE_ID,
      "franchise_approved",
      ID.unique(),
      {
        instituteName: franchiseData.instituteName,
        email: franchiseData.email,
        userId: userId,
        createdAt: new Date().toISOString()
      }
    )

    /* 3️⃣ DELETE FROM REQUESTS */

    await databases.deleteDocument(
      DATABASE_ID,
      "franchise_requests",
      requestId
    )

    return NextResponse.json({ success: true })

  } catch (error) {

    console.error("APPROVE ERROR:", error)

    return NextResponse.json({
      success: false,
      error: error.message
    })

  }

}