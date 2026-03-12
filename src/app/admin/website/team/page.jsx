'use client'

import { useEffect, useState } from 'react'
import { databases, storage } from '@/lib/appwrite'
import { ID, Query } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = 'team'
const BUCKET_ID = '6986e8a4001925504f6b' // change if using different bucket

export default function TeamCMS() {
  const [team, setTeam] = useState([])
  const [newMember, setNewMember] = useState({
    name: '',
    role: '',
    imageUrl: null,
  })

  const fetchTeam = async () => {
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.orderAsc('order')]
      )
      setTeam(res.documents)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchTeam()
  }, [])

  const uploadImage = async (file) => {
    try {
      const uploaded = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        file
      )

      const fileUrl = storage.getFileView(
        BUCKET_ID,
        uploaded.$id
      )

      setNewMember(prev => ({
        ...prev,
        imageUrl: fileUrl,
      }))
    } catch (err) {
      console.error(err)
      alert('Image upload failed')
    }
  }

  const addMember = async () => {
    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          name: newMember.name,
          role: newMember.role,
          imageUrl: newMember.imageUrl || null,
          order: team.length + 1,
        }
      )

      setNewMember({
        name: '',
        role: '',
        imageUrl: null,
      })

      fetchTeam()
    } catch (err) {
      console.error(err)
    }
  }

  const deleteMember = async (id) => {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID,
        id
      )
      fetchTeam()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold">Team CMS</h1>

      {/* ADD NEW */}
      <div className="space-y-4 border p-6">

        <input
          className="border p-3 w-full"
          placeholder="Member Name"
          value={newMember.name}
          onChange={e =>
            setNewMember({ ...newMember, name: e.target.value })
          }
        />

        <input
          className="border p-3 w-full"
          placeholder="Role"
          value={newMember.role}
          onChange={e =>
            setNewMember({ ...newMember, role: e.target.value })
          }
        />

        <input
          type="file"
          onChange={e => uploadImage(e.target.files[0])}
        />

        {newMember.imageUrl && (
          <img
            src={newMember.imageUrl}
            alt="preview"
            className="w-24 h-24 object-cover rounded"
          />
        )}

        <button
          onClick={addMember}
          className="bg-black text-white px-6 py-2"
        >
          Add Member
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {team.map(member => (
          <div
            key={member.$id}
            className="border p-4 flex justify-between items-center"
          >
            <div className="flex gap-4 items-center">
              {member.imageUrl && (
                <img
                  src={member.imageUrl}
                  alt={member.name}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div>
                <h3 className="font-bold">{member.name}</h3>
                <p className="text-sm text-gray-500">
                  {member.role}
                </p>
              </div>
            </div>

            <button
              onClick={() => deleteMember(member.$id)}
              className="text-red-500"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
