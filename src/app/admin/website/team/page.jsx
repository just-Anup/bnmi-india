'use client'

import { useEffect, useState } from 'react'
import { databases, storage } from '@/lib/appwrite'
import { ID, Query } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = 'team'
const BUCKET_ID = '6986e8a4001925504f6b'

export default function TeamCMS() {
  const [team, setTeam] = useState([])
  const [editingMember, setEditingMember] = useState(null)

  const [newMember, setNewMember] = useState({
    name: '',
    role: '',
    experience: '',
    imageUrl: null,
  })

  // FETCH TEAM
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

  // IMAGE UPLOAD (ADD + EDIT)
  const uploadImage = async (file, isEdit = false) => {
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

      if (isEdit) {
        setEditingMember(prev => ({
          ...prev,
          imageUrl: fileUrl,
        }))
      } else {
        setNewMember(prev => ({
          ...prev,
          imageUrl: fileUrl,
        }))
      }
    } catch (err) {
      console.error(err)
      alert('Image upload failed')
    }
  }

  // ADD MEMBER
  const addMember = async () => {
    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          name: newMember.name,
          role: newMember.role,
          experience: newMember.experience,
          imageUrl: newMember.imageUrl || null,
          order: team.length + 1,
        }
      )

      setNewMember({
        name: '',
        role: '',
        experience: '',
        imageUrl: null,
      })

      fetchTeam()
    } catch (err) {
      console.error(err)
    }
  }

  // DELETE MEMBER
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

  // UPDATE MEMBER
  const updateMember = async () => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        editingMember.$id,
        {
          name: editingMember.name,
          role: editingMember.role,
          experience: editingMember.experience,
          imageUrl: editingMember.imageUrl,
        }
      )

      setEditingMember(null)
      fetchTeam()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">

      <h1 className="text-3xl font-bold">Team CMS</h1>

      {/* ADD MEMBER */}
      <div className="bg-white shadow-lg rounded-xl p-8 space-y-5">

        <h2 className="text-xl font-semibold">Add Team Member</h2>

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

        <input
          className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Experience (e.g. 5 Years)"
          value={newMember.experience}
          onChange={e =>
            setNewMember({ ...newMember, experience: e.target.value })
          }
        />

        <input
          type="file"
          className="border rounded-lg p-3 w-full"
          onChange={e => uploadImage(e.target.files[0])}
        />

        {newMember.imageUrl && (
          <img
            src={newMember.imageUrl}
            className="w-24 h-24 rounded object-cover"
          />
        )}

        <button
          onClick={addMember}
          className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
        >
          Add Member
        </button>
      </div>

      {/* TEAM LIST */}
      <div className="space-y-4">

        <h2 className="text-xl font-semibold">Team Members</h2>

        {team.map(member => (

          <div
            key={member.$id}
            className="bg-white border rounded-xl p-5 shadow-sm"
          >

            {editingMember?.$id === member.$id ? (

              // ✏️ EDIT MODE
              <div className="space-y-3">

                <input
                  className="border p-2 rounded w-full"
                  value={editingMember.name}
                  onChange={e =>
                    setEditingMember({
                      ...editingMember,
                      name: e.target.value,
                    })
                  }
                />

                <input
                  className="border p-2 rounded w-full"
                  value={editingMember.role}
                  onChange={e =>
                    setEditingMember({
                      ...editingMember,
                      role: e.target.value,
                    })
                  }
                />

                <input
                  className="border p-2 rounded w-full"
                  value={editingMember.experience || ''}
                  onChange={e =>
                    setEditingMember({
                      ...editingMember,
                      experience: e.target.value,
                    })
                  }
                />

                <input
                  type="file"
                  onChange={e => uploadImage(e.target.files[0], true)}
                />

                {editingMember.imageUrl && (
                  <img
                    src={editingMember.imageUrl}
                    className="w-20 h-20 rounded object-cover"
                  />
                )}

                <div className="flex gap-3">
                  <button
                    onClick={updateMember}
                    className="bg-green-500 text-white px-4 py-1 rounded"
                  >
                    Save
                  </button>

                  <button
                    onClick={() => setEditingMember(null)}
                    className="bg-gray-400 text-white px-4 py-1 rounded"
                  >
                    Cancel
                  </button>
                </div>

              </div>

            ) : (

              // 👁️ NORMAL VIEW
              <div className="flex justify-between items-center">

                <div className="flex gap-4 items-center">

                  {member.imageUrl && (
                    <img
                      src={member.imageUrl}
                      className="w-16 h-16 rounded object-cover"
                    />
                  )}

                  <div>
                    <h3 className="font-bold text-lg">
                      {member.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {member.role}
                    </p>
                    <p className="text-xs text-gray-400">
                      {member.experience}
                    </p>
                  </div>

                </div>

                <div className="flex gap-4">

                  <button
                    onClick={() => setEditingMember(member)}
                    className="text-blue-500 font-semibold hover:text-blue-700"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteMember(member.$id)}
                    className="text-red-500 font-semibold hover:text-red-700"
                  >
                    Delete
                  </button>

                </div>

              </div>

            )}

          </div>

        ))}

      </div>

    </div>
  )
}