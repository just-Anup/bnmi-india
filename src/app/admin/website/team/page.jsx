'use client'

import { useEffect, useState } from 'react'
import { databases, storage } from '@/lib/appwrite'
import { ID, Query } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = 'team'
const BUCKET_ID = '6986e8a4001925504f6b'

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

    <div className="max-w-5xl mx-auto p-8 space-y-8">

      <h1 className="text-3xl font-bold">
        Team CMS
      </h1>

      {/* ADD MEMBER CARD */}

      <div className="bg-white shadow-lg rounded-xl p-8 space-y-5">

        <h2 className="text-xl font-semibold">
          Add Team Member
        </h2>

        <input
          className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Member Name"
          value={newMember.name}
          onChange={e =>
            setNewMember({ ...newMember, name: e.target.value })
          }
        />

        <input
          className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Role"
          value={newMember.role}
          onChange={e =>
            setNewMember({ ...newMember, role: e.target.value })
          }
        />

        <div className="space-y-2">

          <input
            type="file"
            className="border rounded-lg p-3 w-full"
            onChange={e => uploadImage(e.target.files[0])}
          />

          {newMember.imageUrl && (
            <img
              src={newMember.imageUrl}
              alt="preview"
              className="w-28 h-28 object-cover rounded-lg border mt-2"
            />
          )}

        </div>

        <button
          onClick={addMember}
          className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
        >
          Add Member
        </button>

      </div>

      {/* TEAM LIST */}

      <div className="space-y-4">

        <h2 className="text-xl font-semibold">
          Team Members
        </h2>

        {team.map(member => (

          <div
            key={member.$id}
            className="bg-white border rounded-xl p-5 flex justify-between items-center shadow-sm"
          >

            <div className="flex gap-4 items-center">

              {member.imageUrl && (
                <img
                  src={member.imageUrl}
                  alt={member.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              )}

              <div>

                <h3 className="font-bold text-lg">
                  {member.name}
                </h3>

                <p className="text-sm text-gray-500">
                  {member.role}
                </p>

              </div>

            </div>

            <button
              onClick={() => deleteMember(member.$id)}
              className="text-red-500 font-semibold hover:text-red-700"
            >
              Delete
            </button>

          </div>

        ))}

      </div>

    </div>

  )
}