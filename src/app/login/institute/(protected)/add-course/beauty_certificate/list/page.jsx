'use client'

import { useEffect, useState } from 'react'
import { databases, account } from '@/lib/appwrite'
import { Query } from 'appwrite'
import Link from 'next/link'

const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

const COLLECTION_ID =
  'participation_certificates'

export default function ParticipationList() {

  const [certificates, setCertificates] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [search, setSearch] =
    useState('')

  useEffect(() => {

    fetchCertificates()

  }, [])

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
              'franchiseEmail',
              user.email
            ),
            Query.orderDesc(
              '$createdAt'
            ),
            Query.limit(500)
          ]
        )

      setCertificates(
        res.documents
      )

    } catch (error) {

      console.log(error)

      alert(
        'Failed to load certificates'
      )

    } finally {

      setLoading(false)

    }

  }

  const filteredCertificates =
    certificates.filter((item) => {

      const searchText =
        search.toLowerCase()

      return (

        item.studentName
          ?.toLowerCase()
          .includes(searchText)

        ||

        item.courseName
          ?.toLowerCase()
          .includes(searchText)

        ||

        item.certificateNo
          ?.toLowerCase()
          .includes(searchText)

      )

    })

  return (

    <div className="min-h-screen bg-black text-white p-5 lg:p-10">

      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

          <h1 className="text-3xl font-bold">

            Participation Certificates

          </h1>

          <Link
            href="/login/institute/add-course/beauty_certificate/add"
            className="bg-orange-500 hover:bg-orange-600 text-black px-5 py-3 rounded-lg font-semibold"
          >
            + Add Certificate
          </Link>

        </div>

        <input
          type="text"
          placeholder="Search Student / Course / Certificate No"
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          className="w-full mb-6 p-3 rounded-lg bg-[#121212] border border-gray-700"
        />

        {loading ? (

          <div className="text-center py-20">

            Loading...

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full border border-gray-800">

              <thead>

                <tr className="bg-[#121212]">

                  <th className="p-3 border border-gray-800">
                    Sl No
                  </th>

                  <th className="p-3 border border-gray-800">
                    Certificate No
                  </th>

                  <th className="p-3 border border-gray-800">
                    Student Name
                  </th>

                  <th className="p-3 border border-gray-800">
                    Course Name
                  </th>

                  <th className="p-3 border border-gray-800">
                    Duration
                  </th>

                  <th className="p-3 border border-gray-800">
                    Completion Date
                  </th>

                  <th className="p-3 border border-gray-800">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredCertificates.length === 0 ? (

                  <tr>

                    <td
                      colSpan="7"
                      className="text-center p-8"
                    >
                      No Certificates Found
                    </td>

                  </tr>

                ) : (

                  filteredCertificates.map(
                    (item, index) => (

                      <tr
                        key={item.$id}
                        className="hover:bg-[#1a1a1a]"
                      >

                        <td className="p-3 border border-gray-800">

                          {index + 1}

                        </td>

                        <td className="p-3 border border-gray-800">

                          {item.certificateNo}

                        </td>

                        <td className="p-3 border border-gray-800">

                          {item.studentName}

                        </td>

                        <td className="p-3 border border-gray-800">

                          {item.courseName}

                        </td>

                        <td className="p-3 border border-gray-800">

                          {item.courseDuration}

                        </td>

                        <td className="p-3 border border-gray-800">

                          {item.dateOfCompletion}

                        </td>

                        <td className="p-3 border border-gray-800">

                          <div className="flex gap-2">

<Link
  href={`/login/institute/add-course/beauty_certificate/view/${item.certificateNo}`}
  target="_blank"
  className="bg-green-600 px-3 py-2 rounded"
>
  View
</Link>

                            <a
                              href={item.verifyUrl}
                              target="_blank"
                              className="bg-blue-600 px-3 py-2 rounded"
                            >
                              Verify
                            </a>

                          </div>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>

  )
}