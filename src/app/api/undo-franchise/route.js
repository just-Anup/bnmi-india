import { NextResponse } from 'next/server'
import { Client, Databases, Users, ID } from 'node-appwrite'

export async function POST(req) {
  try {
    const { requestId, franchiseData, fromCollection } = await req.json()

    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY)

    const databases = new Databases(client)
    const users = new Users(client)

    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

    /* DELETE AUTH USER */
    try {
      const authUsers = await users.list({
        search: franchiseData.email
      })

      if (authUsers.users.length > 0) {
        await users.delete(authUsers.users[0].$id)
      }
    } catch {}

    /* MOVE BACK TO PENDING */
    await databases.createDocument(
      DATABASE_ID,
      'franchise_requests',
      ID.unique(),
      franchiseData
    )

    /* DELETE FROM APPROVED OR REJECTED */
    await databases.deleteDocument(
      DATABASE_ID,
      fromCollection,
      requestId
    )

    return NextResponse.json({ success: true })

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message })
  }
}
