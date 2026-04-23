"use client"

import { useEffect, useState } from "react"
import { Query } from "appwrite"
import AddInstallmentModal from "../../../../../../component/AddInstallmentModal"
import InstallmentHistory from "../../../../../../component/InstallmentHistory"
import InstallmentChart from "../../../../../../component/InstallmentChart"
import { account, databases } from "@/lib/appwrite"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function InstallmentPage() {
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      setLoading(true)

      const user = await account.get()

      const franchiseRes = await databases.listDocuments(
        DATABASE_ID,
        "franchise_approved",
        [Query.equal("email", user.email)]
      )

      if (franchiseRes.documents.length === 0) {
        setStudents([])
        return
      }

      const franchiseId = franchiseRes.documents[0].$id

      const res = await databases.listDocuments(
        DATABASE_ID,
        "student_admissions",
        [
          Query.equal("franchiseId", franchiseId),
          Query.orderDesc("$createdAt"),
          Query.limit(100)
        ]
      )

      setStudents(res.documents || [])

    } catch (err) {
      console.error("FETCH ERROR:", err)
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  const openModal = (student) => {
  if (!student || !student.$id) return
  setSelectedStudent(student)
  setShowModal(true)
}

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Student Installments
        </h1>
        <p className="text-gray-500 text-sm">
          Manage student payments and track installments
        </p>
      </div>

      {/* CHART */}
      <div className="mb-6">
        <InstallmentChart />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-700">
            Student List
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th className="p-4 text-left">Student</th>
                <th className="text-right pr-6">Total Fee</th>
                <th className="text-right pr-6">Paid</th>
                <th className="text-right pr-6">Remaining</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center">
                    Loading...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-gray-500">
                    No students found
                  </td>
                </tr>
              ) : (
              students?.filter(s => s && s.$id).map((student) => (
                    <tr
                      key={student?.$id}
                      className="border-t hover:bg-gray-50 transition"
                    >

                      {/* NAME */}
                      <td className="p-4 text-left font-medium text-gray-800">
                        {student?.studentName || "N/A"}
                      </td>

                      {/* TOTAL */}
                      <td className="text-right pr-6 text-gray-700">
                        ₹{student?.totalFees || 0}
                      </td>

                      {/* PAID */}
                      <td className="text-right pr-6 text-green-600 font-semibold">
                        ₹{student?.feesReceived || 0}
                      </td>

                      {/* REMAINING */}
                      <td className="text-right pr-6 text-red-500 font-semibold">
                        ₹{student?.balance || 0}
                      </td>

                      {/* ACTION */}
                      <td>
                        <div className="flex gap-2 justify-center">

                          {/* ADD */}
                          <button
                            onClick={() => openModal(student)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs shadow"
                          >
                            + Add Installment
                          </button>

                          {/* VIEW */}
                          <button
                           onClick={() => {
  if (!student || !student.$id) return
  setSelectedStudent(student)
}}
                            className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs shadow"
                          >
                            View Installment
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))
              )}

            </tbody>

          </table>
        </div>
      </div>

      {/* ADD MODAL */}
      {showModal && selectedStudent?.$id && (
        <AddInstallmentModal
          student={selectedStudent}
          onClose={() => setShowModal(false)}
          refresh={() => {
            fetchStudents()
            if (selectedStudent) {
              setSelectedStudent({ ...selectedStudent })
            }
          }}
        />
      )}

      {/* VIEW HISTORY */}
      {selectedStudent?.$id && (
        <div className="mt-6">
          <InstallmentHistory student={selectedStudent} />
        </div>
      )}

    </div>
  )
}