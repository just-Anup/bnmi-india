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
  const [editingId, setEditingId] = useState(null)

  const [newService, setNewService] = useState({
    title: '',
    state: '',
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

      setNewService(prev => ({
        ...prev,
        imageUrl: url
      }))
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Image upload failed')
    }

    setUploading(false)
  }

  /* ---------------- ADD / UPDATE ---------------- */
  const saveService = async () => {
    if (!newService.title || !newService.state) {
      alert('Title & State are required')
      return
    }

    try {
      if (editingId) {
        // UPDATE
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID,
          editingId,
          {
            ...newService
          }
        )

        alert('Service updated successfully')
      } else {
        // ADD
        await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID,
          ID.unique(),
          {
            ...newService,
            order: services.length + 1,
          }
        )

        alert('Service added successfully')
      }

      resetForm()
      fetchServices()

    } catch (error) {
      console.error('Save failed:', error)
    }
  }

  /* ---------------- EDIT ---------------- */
  const editService = (service) => {
    setEditingId(service.$id)

    setNewService({
      title: service.title || '',
      state: service.state || '',
      imageUrl: service.imageUrl || '',
      description: service.description || '',
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  /* ---------------- RESET ---------------- */
  const resetForm = () => {
    setEditingId(null)

    setNewService({
      title: '',
      state: '',
      imageUrl: '',
      description: '',
    })
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

      {/* ================= FORM ================= */}
      <div className="bg-white/70 backdrop-blur-xl border border-gray-200 shadow-xl rounded-2xl p-8 space-y-6">

        <h2 className="text-xl font-semibold">
          {editingId ? 'Edit Service' : 'Add New Service'}
        </h2>

        <div className="grid md:grid-cols-2 gap-5">

          <input
            className="border rounded-xl p-3 w-full focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Service Title"
            value={newService.title}
            onChange={(e) =>
              setNewService({
                ...newService,
                title: e.target.value
              })
            }
          />

          <input
            className="border rounded-xl p-3 w-full focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="State"
            value={newService.state}
            onChange={(e) =>
              setNewService({
                ...newService,
                state: e.target.value
              })
            }
          />

        </div>

        <textarea
          className="border rounded-xl p-3 w-full h-28 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Description"
          value={newService.description}
          onChange={(e) =>
            setNewService({
              ...newService,
              description: e.target.value
            })
          }
        />

        {/* IMAGE */}
        <div className="space-y-2">

          <input
            type="file"
            accept="image/*"
            className="border rounded-xl p-3 w-full"
            onChange={(e) =>
              uploadImage(e.target.files[0])
            }
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

        <div className="flex gap-3">

          <button
            onClick={saveService}
            className="flex-1 bg-black text-white py-3 rounded-xl hover:bg-gray-900 transition font-medium"
          >
            {editingId ? 'Update Service' : 'Add Service'}
          </button>

          {editingId && (
            <button
              onClick={resetForm}
              className="px-6 bg-gray-200 rounded-xl hover:bg-gray-300"
            >
              Cancel
            </button>
          )}

        </div>

      </div>

      {/* ================= LIST ================= */}
      <div className="space-y-5">

        <h2 className="text-xl font-semibold">
          Existing Services
        </h2>

        {services.map((service) => (

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

                <span className="inline-block mt-1 px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-600 font-medium">
                  {service.state}
                </span>

                <p className="text-sm text-gray-500 mt-2 max-w-md">
                  {service.description}
                </p>

              </div>

            </div>

            <div className="flex gap-2">

              <button
                onClick={() => editService(service)}
                className="px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition font-medium"
              >
                Edit
              </button>

              <button
                onClick={() => deleteService(service.$id)}
                className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition font-medium"
              >
                Delete
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>
  )
}