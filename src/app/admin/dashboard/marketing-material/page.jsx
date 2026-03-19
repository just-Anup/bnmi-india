'use client'

import { useEffect, useState } from 'react'
import { databases } from '@/lib/appwrite'
import Link from 'next/link'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION_ID = 'marketing_materials'

export default function MarketingList() {
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedImage, setSelectedImage] = useState(null)

  const itemsPerPage = 6

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID)
    setData(res.documents)
  }

  const deleteItem = async (id) => {
    await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, id)
    fetchData()
  }

  const filtered = data.filter(item =>
    item.title?.toLowerCase().includes(search.toLowerCase())
  )

  const paginated = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  const totalPages = Math.ceil(filtered.length / itemsPerPage)

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white rounded-2xl shadow p-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Marketing Materials</h1>
          <Link href="/admin/dashboard/marketing-material/add">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
              Add Material
            </button>
          </Link>
        </div>

        {/* Search */}
        <div className="flex justify-between mb-4">
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded-lg w-64"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">#</th>
                <th className="p-2">Image</th>
                <th className="p-2">Title</th>
                <th className="p-2">Description</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((item, index) => (
                <tr key={item.$id} className="border-t">
                  <td className="p-2">{index + 1}</td>

                  <td className="p-2">
                    <img
                      src={item.image}
                      className=" relative left-[60px]   h-12 w-12  object-cover cursor-pointer rounded"
                      onClick={() => setSelectedImage(item.image)}
                    />
                  </td>

                  <td className="p-2 relative left-[60px] ">{item.title}</td>
                  <td className="p-2 text-sm relative left-[70px] ">{item.description}</td>

                  <td className="p-2 flex gap-2 relative left-[220px] ">
                    <Link href={`/admin/dashboard/marketing-material/edit/${item.$id}`}>
                      <button className="bg-yellow-500 text-white px-2 py-1 rounded">Edit</button>
                    </Link>

                    <button
                      onClick={() => deleteItem(item.$id)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Delete
                    </button>

                    <a href={item.image} download>
                      <button className="bg-green-600 text-white px-2 py-1 rounded">
                        Download
                      </button>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-end mt-4 gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 rounded ${page === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>

      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-xl">
            <img src={selectedImage} className="max-h-[400px]" />
            <button
              onClick={() => setSelectedImage(null)}
              className="mt-3 bg-red-500 text-white px-4 py-1 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
