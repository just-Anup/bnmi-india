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
    imageUrl: '',
    description: '',
  })

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

  const addService = async () => {
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

      setNewService({ title: '', imageUrl: '', description: '' })
      fetchServices()
    } catch (error) {
      console.error('Add failed:', error)
    }
  }

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

    <div className="max-w-5xl mx-auto p-8 space-y-8">

      <h1 className="text-3xl font-bold">
        Services CMS
      </h1>

      {/* Add Service Card */}

      <div className="bg-white shadow-lg rounded-xl p-8 space-y-5">

        <h2 className="text-xl font-semibold">
          Add New Service
        </h2>

        <input
          className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Service Title"
          value={newService.title}
          onChange={e =>
            setNewService({ ...newService, title: e.target.value })
          }
        />

        <textarea
          className="border rounded-lg p-3 w-full h-28 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Description"
          value={newService.description}
          onChange={e =>
            setNewService({ ...newService, description: e.target.value })
          }
        />

        <div className="space-y-2">

          <input
            type="file"
            accept="image/*"
            className="border rounded-lg p-3 w-full"
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
              className="h-20 rounded-lg border mt-2"
            />
          )}

        </div>

        <button
          onClick={addService}
          className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
        >
          Add Service
        </button>

      </div>

      {/* Services List */}

      <div className="space-y-4">

        <h2 className="text-xl font-semibold">
          Existing Services
        </h2>

        {services.map(service => (

          <div
            key={service.$id}
            className="bg-white border rounded-xl p-5 flex justify-between items-center shadow-sm"
          >

            <div className="flex items-center gap-4">

              {service.imageUrl && (
                <img
                  src={service.imageUrl}
                  className="h-14 w-14 object-cover rounded-lg"
                />
              )}

              <div>

                <h3 className="font-bold text-lg">
                  {service.title}
                </h3>

                <p className="text-sm text-gray-500 max-w-md">
                  {service.description}
                </p>

              </div>

            </div>

            <button
              onClick={() => deleteService(service.$id)}
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