export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { Client, Databases, Users } from 'node-appwrite'

export async function POST(req) {
  try {
    const { requestId, franchiseData } = await req.json()

    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY)

    const databases = new Databases(client)
    const users = new Users(client)

    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

    /* 1️⃣ DELETE AUTH USER IF EXISTS */
    try {
      const authUsers = await users.list({
        search: franchiseData.email
      })

      if (authUsers.users.length > 0) {
        await users.delete(authUsers.users[0].$id)
      }

    } catch {}

    /* 2️⃣ MOVE TO REJECTED */
    await databases.createDocument(
      DATABASE_ID,
      'franchise_rejected',
      'unique()',
      franchiseData
    )

    /* 3️⃣ DELETE FROM PENDING */
    await databases.deleteDocument(
      DATABASE_ID,
      'franchise_requests',
      requestId
    )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: error.message })
  }
}
