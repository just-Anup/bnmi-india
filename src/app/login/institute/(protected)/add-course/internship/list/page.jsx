'use client'

import { useEffect, useState } from 'react'
import { databases, account } from '@/lib/appwrite'
import { Query } from 'appwrite'
import Link from 'next/link'

const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

const COLLECTION_ID =
  'internship_certificates'

export default function InternshipList() {

  const [certificates, setCertificates] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [search, setSearch] =
    useState('')

  const fetchCertificates = async () => {

    try {

      const user =
        await account.get()

      const res =
        await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID,
          [
            Query.equal(
              "franchiseEmail",
              user.email
            ),
            Query.limit(100)
          ]
        )

      setCertificates(
        res.documents.reverse()
      )

    } catch (error) {

      console.log(error)

    } finally {

      setLoading(false)

    }
  }

  useEffect(() => {

    fetchCertificates()

  }, [])

  const deleteCertificate =
    async (id) => {

      const confirmDelete =
        confirm(
          "Delete this certificate?"
        )

      if (!confirmDelete) return

      try {

        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTION_ID,
          id
        )

        fetchCertificates()

      } catch (error) {

        console.log(error)

        alert("Delete failed")
      }
    }

  if (loading) {

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    )
  }

  return (

    <div className="min-h-screen bg-black text-white p-4 lg:p-10">

      <div className="bg-[#121212] border border-gray-800 rounded-xl p-5">

        <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">

          <h2 className="text-2xl font-bold">
            INTERNSHIP CERTIFICATE LIST
          </h2>

          <Link
            href="/login/institute/internship/add"
          >
            <button className="bg-orange-500 hover:bg-orange-600 text-black px-5 py-2 rounded-lg font-semibold">
              Add Internship
            </button>
          </Link>

        </div>

        {/* SEARCH */}

        <input
          type="text"
          placeholder="Search Student Name..."
          value={search}
          onChange={(e) =>
            setSearch(
              
              e.target.value
            )
          }
          className="w-full bg-black border border-gray-700 p-3 rounded-lg mb-6"
        />

        {/* TABLE */}

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1100px] border-collapse">

            <thead>

              <tr className="bg-orange-500 text-black">

                <th className="p-3 border">
                  Sr
                </th>

                <th className="p-3 border">
                  Photo
                </th>

                <th className="p-3 border">
                  Student Name
                </th>

                <th className="p-3 border">
                  Internship
                </th>

                <th className="p-3 border">
                  Shift
                </th>

                <th className="p-3 border">
                  Days
                </th>

                <th className="p-3 border">
                  Issue Date
                </th>

                <th className="p-3 border">
                  Certificate No
                </th>

                <th className="p-3 border">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {certificates
                .filter((item) =>
                  item.studentName
                    ?.toLowerCase()
                    .includes(
                      search.toLowerCase()
                    )
                )
                .map(
                  (
                    item,
                    index
                  ) => (

                    <tr
                      key={item.$id}
                      className="hover:bg-[#1a1a1a]"
                    >

                      <td className="border p-3 text-center">
                        {index + 1}
                      </td>

                      <td className="border p-3 text-center">

                        <img
                          src={
                            item.studentPhoto
                          }
                          alt=""
                          className="w-14 h-14 object-cover rounded-full mx-auto border"
                        />

                      </td>

                      <td className="border p-3">
                        {
                          item.studentName
                        }
                      </td>

                      <td className="border p-3">
                        {
                          item.internshipTitle
                        }
                      </td>

                      <td className="border p-3">
                        {
                          item.shift
                        }
                      </td>

                      <td className="border p-3">
                        {
                          item.days
                        }
                      </td>

                      <td className="border p-3">
                        {
                          item.issueDate
                        }
                      </td>

                      <td className="border p-3">
                        {
                          item.certificateNo
                        }
                      </td>

                      <td className="border p-3">

                        <div className="flex gap-2 flex-wrap">

                          <Link
                            href={`/login/institute/add-course/internship/view/${item.$id}`}
                          >
                            <button className="bg-green-500 hover:bg-green-600 text-black px-3 py-1 rounded">
                              View
                            </button>
                          </Link>

                          <button
                            onClick={() =>
                              deleteCertificate(
                                item.$id
                              )
                            }
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              {certificates.length === 0 && (

                <tr>

                  <td
                    colSpan="9"
                    className="text-center p-10"
                  >
                    No Internship Certificates Found
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  )
}