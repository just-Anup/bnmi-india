'use client'

import { useEffect, useState } from 'react'
import { databases, storage } from '@/lib/appwrite'
import { ID, Query } from 'appwrite'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = 'services'
const BUCKET_ID = '6986e8a4001925504f6b'

export default function ServicesCMS() {
  const [services, setServices] = useState([])
  const [uploading, setUploading] = useState(false)

  const [newService, setNewService] = useState({
    title: '',
    state: '', // ✅ ADDED
    imageUrl: '',
    description: '',
  })

  /* ---------------- FETCH ---------------- */
  const fetchServices = async () => {
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.orderAsc('order')]
      )
      setServices(res.documents)
    } catch (error) {
      console.error('Fetch services failed:', error)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  /* ---------------- IMAGE UPLOAD ---------------- */
  const uploadImage = async (file) => {
    if (!file) return

    setUploading(true)

    try {
      const uploaded = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        file
      )

      const url = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${uploaded.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`

      setNewService(prev => ({ ...prev, imageUrl: url }))
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Image upload failed')
    }

    setUploading(false)
  }

  /* ---------------- ADD ---------------- */
  const addService = async () => {
    if (!newService.title || !newService.state) {
      alert('Title & State are required')
      return
    }

    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          ...newService,
          order: services.length + 1,
        }
      )

      setNewService({
        title: '',
        state: '',
        imageUrl: '',
        description: '',
      })

      fetchServices()
    } catch (error) {
      console.error('Add failed:', error)
    }
  }

  /* ---------------- DELETE ---------------- */
  const deleteService = async (id) => {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID,
        id
      )
      fetchServices()
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-10">

      <h1 className="text-3xl font-bold tracking-tight">
        Services CMS
      </h1>

      {/* ================= ADD CARD ================= */}
      <div className="bg-white/70 backdrop-blur-xl border border-gray-200 shadow-xl rounded-2xl p-8 space-y-6">

        <h2 className="text-xl font-semibold">
          Add New Service
        </h2>

        {/* GRID FORM */}
        <div className="grid md:grid-cols-2 gap-5">

          <input
            className="border rounded-xl p-3 w-full focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Service Title"
            value={newService.title}
            onChange={e =>
              setNewService({ ...newService, title: e.target.value })
            }
          />

          <input
            className="border rounded-xl p-3 w-full focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="State (e.g. Assam)"
            value={newService.state}
            onChange={e =>
              setNewService({ ...newService, state: e.target.value })
            }
          />

        </div>

        <textarea
          className="border rounded-xl p-3 w-full h-28 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Description"
          value={newService.description}
          onChange={e =>
            setNewService({ ...newService, description: e.target.value })
          }
        />

        {/* IMAGE */}
        <div className="space-y-2">

          <input
            type="file"
            accept="image/*"
            className="border rounded-xl p-3 w-full"
            onChange={e => uploadImage(e.target.files[0])}
          />

          {uploading && (
            <p className="text-sm text-gray-500">
              Uploading image...
            </p>
          )}

          {newService.imageUrl && (
            <img
              src={newService.imageUrl}
              className="h-24 rounded-xl border mt-2 shadow"
            />
          )}

        </div>

        <button
          onClick={addService}
          className="w-full bg-black text-white py-3 rounded-xl 
          hover:bg-gray-900 transition font-medium tracking-wide"
        >
          Add Service
        </button>

      </div>

      {/* ================= LIST ================= */}
      <div className="space-y-5">

        <h2 className="text-xl font-semibold">
          Existing Services
        </h2>

        {services.map(service => (

          <div
            key={service.$id}
            className="bg-white border rounded-2xl p-5 flex justify-between items-center shadow-sm hover:shadow-md transition"
          >

            <div className="flex items-center gap-4">

              {service.imageUrl && (
                <img
                  src={service.imageUrl}
                  className="h-16 w-16 object-cover rounded-xl"
                />
              )}

              <div>

                <h3 className="font-semibold text-lg">
                  {service.title}
                </h3>

                {/* STATE BADGE */}
                <span className="inline-block mt-1 px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-600 font-medium">
                  {service.state}
                </span>

                <p className="text-sm text-gray-500 mt-2 max-w-md">
                  {service.description}
                </p>

              </div>

            </div>

            <button
              onClick={() => deleteService(service.$id)}
              className="px-4 py-2 rounded-lg bg-red-50 text-red-600 
              hover:bg-red-100 transition font-medium"
            >
              Delete
            </button>

          </div>

        ))}

      </div>

    </div>
  )
}