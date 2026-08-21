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


  // =========================
  // FETCH
  // =========================

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
        [...res.documents].reverse()
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


  // =========================
  // DELETE
  // =========================

  const deleteCertificate =
    async (id) => {

      const confirmDelete =
        confirm(
          "Delete this certificate and marksheet?"
        )

      if (!confirmDelete) {
        return
      }


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


  // =========================
  // LOADING
  // =========================

  if (loading) {

    return (

      <div className="min-h-screen bg-black text-white flex items-center justify-center">

        Loading...

      </div>

    )

  }


  // =========================
  // FILTER
  // =========================

  const filteredCertificates =
    certificates.filter(
      (item) =>
        item.studentName
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          )
    )


  // =========================
  // UI
  // =========================

  return (

    <div className="min-h-screen bg-black text-white p-4 lg:p-10">

      <div className="bg-[#121212] border border-gray-800 rounded-xl p-5">

        {/* HEADER */}

        <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">

          <div>

            <h2 className="text-2xl font-bold">
              INTERNSHIP CERTIFICATE LIST
            </h2>

            <p className="text-gray-400 mt-1">
              View certificates and marksheets
            </p>

          </div>


          <Link
            href="/login/institute/internship/add"
          >

            <button
              className="bg-orange-500 hover:bg-orange-600 text-black px-5 py-2 rounded-lg font-semibold"
            >
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
            setSearch(e.target.value)
          }
          className="w-full bg-black border border-gray-700 p-3 rounded-lg mb-6"
        />


        {/* TABLE */}

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1200px] border-collapse">

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
                  Duration
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

              {filteredCertificates.map(
                (item, index) => (

                  <tr
                    key={item.$id}
                    className="hover:bg-[#1a1a1a]"
                  >

                    {/* SR */}

                    <td className="border p-3 text-center">
                      {index + 1}
                    </td>


                    {/* PHOTO */}

                    <td className="border p-3 text-center">

                      <img
                        src={
                          item.studentPhoto
                        }
                        alt=""
                        className="w-14 h-14 object-cover rounded-full mx-auto border border-gray-600"
                      />

                    </td>


                    {/* NAME */}

                    <td className="border p-3">

                      {item.studentName}

                    </td>


                    {/* INTERNSHIP */}

                    <td className="border p-3">

                      {item.internshipTitle}

                    </td>


                    {/* SHIFT */}

                    <td className="border p-3">

                      {item.shift}

                    </td>


                    {/* DURATION */}

                    <td className="border p-3">

                      {item.days}

                    </td>


                    {/* ISSUE DATE */}

                    <td className="border p-3">

                      {item.issueDate}

                    </td>


                    {/* CERTIFICATE NUMBER */}

                    <td className="border p-3">

                      {item.certificateNo}

                    </td>


                    {/* ACTION */}

                    <td className="border p-3">

                      <div className="flex gap-2 flex-wrap">

                        {/* CERTIFICATE */}

                        <Link
                          href={`/login/institute/add-course/internship/view/${item.$id}`}
                        >

                          <button
                            className="bg-green-500 hover:bg-green-600 text-black px-3 py-2 rounded"
                          >
                            Certificate
                          </button>

                        </Link>


                        {/* MARKSHEET */}

                        <Link
                          href={`/login/institute/add-course/internship/marksheet/${item.$id}`}
                        >

                          <button
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
                          >
                            Marksheet
                          </button>

                        </Link>


                        {/* DELETE */}

                        <button
                          onClick={() =>
                            deleteCertificate(
                              item.$id
                            )
                          }
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded"
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )}


              {filteredCertificates.length === 0 && (

                <tr>

                  <td
                    colSpan="9"
                    className="text-center p-10 text-gray-400"
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