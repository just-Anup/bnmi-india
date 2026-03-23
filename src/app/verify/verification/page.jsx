'use client'

export const dynamic = "force-dynamic";

import { useState } from "react"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function VerifyHome() {

  const [activeTab, setActiveTab] = useState("atc")

  const [atc, setAtc] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const [franchise, setFranchise] = useState(null)
  const [student, setStudent] = useState(null)

  const [loading, setLoading] = useState(false)

  // 🔵 ATC VERIFY
  const handleATCSearch = async () => {

    if (!atc) return alert("Enter ATC Code")

    setLoading(true)

    try {

      const res = await databases.listDocuments(
        DATABASE_ID,
        "franchise_approved",
        [Query.equal("atcCode", atc)]
      )

      if (!res.documents.length) {
        alert("Invalid ATC Code ❌")
        setFranchise(null)
      } else {
        setFranchise(res.documents[0])
        setStudent(null)
      }

    } catch {
      alert("Search failed")
    }

    setLoading(false)
  }

  // 🟢 STUDENT VERIFY
  const handleStudentVerify = async () => {

    if (!username || !password) {
      return alert("Enter Username & Password")
    }

    setLoading(true)

    try {

      const res = await databases.listDocuments(
        DATABASE_ID,
        "student_admissions",
        [
          Query.equal("username", username),
          Query.equal("password", password)
        ]
      )

      if (!res.documents.length) {
        alert("Invalid Login ❌")
        setStudent(null)
      } else {
        setStudent(res.documents[0])
        setFranchise(null)
      }

    } catch {
      alert("Verification failed")
    }

    setLoading(false)
  }

  return (

    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center p-6">

      <div className="w-full max-w-4xl">

        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            BNMI Verification Portal
          </h1>
          <p className="text-gray-600 mt-2">
            Verify Franchise & Student Credentials
          </p>
        </div>

        {/* CARD */}
        <div className="bg-white rounded-2xl shadow-xl p-6">

          {/* TABS */}
          <div className="flex mb-6 border-b">

            <button
              onClick={() => setActiveTab("atc")}
              className={`flex-1 py-2 font-semibold ${
                activeTab === "atc"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-500"
              }`}
            >
              Franchise Verification
            </button>

            <button
              onClick={() => setActiveTab("student")}
              className={`flex-1 py-2 font-semibold ${
                activeTab === "student"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500"
              }`}
            >
              Student Verification
            </button>

          </div>

          {/* CONTENT */}

          {activeTab === "atc" && (

            <div className="space-y-4">

              <input
                type="text"
                placeholder="Enter ATC Code"
                value={atc}
                onChange={(e)=>setAtc(e.target.value)}
                className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />

              <button
                onClick={handleATCSearch}
                className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition"
              >
                {loading ? "Verifying..." : "Verify ATC"}
              </button>

            </div>
          )}

          {activeTab === "student" && (

            <div className="space-y-4">

              <input
                placeholder="Username"
                value={username}
                onChange={(e)=>setUsername(e.target.value)}
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
              />

              <button
                onClick={handleStudentVerify}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
              >
                {loading ? "Verifying..." : "Verify Student"}
              </button>

            </div>
          )}

        </div>

        {/* RESULT SECTION */}

        {franchise && (
          <div className="mt-6 bg-white p-6 rounded-2xl shadow-lg">

            <h2 className="text-xl font-bold text-green-600 mb-4 text-center">
              ✔ Verified Franchise
            </h2>

            <div className="grid grid-cols-2 gap-4 text-sm">

              <p><b>Institute:</b> {franchise.instituteName}</p>
              <p><b>Owner:</b> {franchise.name}</p>
              <p><b>ATC Code:</b> {franchise.atcCode}</p>
              <p><b>Email:</b> {franchise.email}</p>
              <p><b>Mobile:</b> {franchise.mobile}</p>
              <p><b>City:</b> {franchise.city}</p>

            </div>

          </div>
        )}

        {student && (
          <div className="mt-6 bg-white p-6 rounded-2xl shadow-lg">

            <h2 className="text-xl font-bold text-green-600 mb-4 text-center">
              ✔ Verified Student
            </h2>

            <div className="grid grid-cols-2 gap-4 text-sm">

              <p><b>Name:</b> {student.studentName}</p>
              <p><b>Course:</b> {student.courseName}</p>
              <p><b>Mobile:</b> {student.mobile}</p>
              <p><b>Email:</b> {student.email}</p>
              <p><b>Institute:</b> {student.instituteName}</p>
              <p><b>Admission Date:</b> {student.admissionDate}</p>

            </div>

          </div>
        )}

      </div>

    </div>
  )
}