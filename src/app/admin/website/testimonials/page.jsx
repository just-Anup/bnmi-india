"use client"

import { useEffect, useState } from 'react'
import { databases, storage } from '@/lib/appwrite'
import { ID, Query } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = 'testimonials'
const BUCKET_ID = '6986e8a4001925504f6b'

export default function TestimonialsCMS() {
  const [testimonials, setTestimonials] = useState([])
  const [newTestimonial, setNewTestimonial] = useState({
    name: '',
    role: '',
    text: '',
    imageUrl: null,
  })

  const fetchTestimonials = async () => {
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.orderAsc('order')]
      )
      setTestimonials(res.documents)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchTestimonials()
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

      setNewTestimonial(prev => ({
        ...prev,
        imageUrl: fileUrl,
      }))
    } catch (err) {
      console.error(err)
      alert('Upload failed')
    }
  }

  const addTestimonial = async () => {
    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          name: newTestimonial.name,
          role: newTestimonial.role,
          text: newTestimonial.text,
          imageUrl: newTestimonial.imageUrl || null,
          order: testimonials.length + 1,
        }
      )

      setNewTestimonial({
        name: '',
        role: '',
        text: '',
        imageUrl: null,
      })

      fetchTestimonials()
    } catch (err) {
      console.error(err)
    }
  }

  const deleteTestimonial = async (id) => {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID,
        id
      )
      fetchTestimonials()
    } catch (err) {
      console.error(err)
    }
  }

  return (

    <div className="max-w-5xl mx-auto p-8 space-y-8">

      <h1 className="text-3xl font-bold">
        Testimonials CMS
      </h1>

      {/* ADD TESTIMONIAL CARD */}

      <div className="bg-white shadow-lg rounded-xl p-8 space-y-5">

        <h2 className="text-xl font-semibold">
          Add Testimonial
        </h2>

        <input
          className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Name"
          value={newTestimonial.name}
          onChange={e =>
            setNewTestimonial({
              ...newTestimonial,
              name: e.target.value,
            })
          }
        />

        <input
          className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Role"
          value={newTestimonial.role}
          onChange={e =>
            setNewTestimonial({
              ...newTestimonial,
              role: e.target.value,
            })
          }
        />

        <textarea
          className="border rounded-lg p-3 w-full h-28 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Testimonial Text"
          value={newTestimonial.text}
          onChange={e =>
            setNewTestimonial({
              ...newTestimonial,
              text: e.target.value,
            })
          }
        />

        <div className="space-y-2">

          <input
            type="file"
            className="border rounded-lg p-3 w-full"
            onChange={e => uploadImage(e.target.files[0])}
          />

          {newTestimonial.imageUrl && (
            <img
              src={newTestimonial.imageUrl}
              alt="preview"
              className="w-24 h-24 object-cover rounded-lg border mt-2"
            />
          )}

        </div>

        <button
          onClick={addTestimonial}
          className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
        >
          Add Testimonial
        </button>

      </div>

      {/* TESTIMONIAL LIST */}

      <div className="space-y-4">

        <h2 className="text-xl font-semibold">
          Existing Testimonials
        </h2>

        {testimonials.map(t => (

          <div
            key={t.$id}
            className="bg-white border rounded-xl p-5 flex justify-between items-center shadow-sm"
          >

            <div className="flex gap-4 items-center">

              {t.imageUrl && (
                <img
                  src={t.imageUrl}
                  alt={t.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              )}

              <div>

                <h3 className="font-bold text-lg">
                  {t.name}
                </h3>

                <p className="text-sm text-gray-500">
                  {t.role}
                </p>

                <p className="text-sm text-gray-600 max-w-md mt-1">
                  {t.text}
                </p>

              </div>

            </div>

            <button
              onClick={() => deleteTestimonial(t.$id)}
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