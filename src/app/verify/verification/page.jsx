'use client'

export const dynamic = "force-dynamic";

import { useState } from "react"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function VerifyHome() {

  const [activeTab, setActiveTab] = useState("atc")

  const [atc, setAtc] = useState("")
  const [username, setUsername] = useState("")   // kept (not used)
  const [password, setPassword] = useState("")   // kept (not used)

  const [certificateNo, setCertificateNo] = useState("") // ✅ added

  const [franchise, setFranchise] = useState(null)
  const [student, setStudent] = useState(null)

  const [loading, setLoading] = useState(false)
  const [exam, setExam] = useState(null)
const [franchiseData, setFranchiseData] = useState(null)
const [showModal, setShowModal] = useState(false)

  // 🔵 ATC VERIFY (UNCHANGED)
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

  // 🟢 STUDENT VERIFY (ONLY THIS UPDATED)
  const handleStudentVerify = async () => {

    if (!certificateNo) {
      return alert("Enter Certificate Number")
    }

    setLoading(true)

    try {

      const res = await databases.listDocuments(
        DATABASE_ID,
        "student_admissions",
        [
          Query.equal("certificateNo", certificateNo)
        ]
      )

      if (!res.documents.length) {
        alert("Invalid Certificate Number ❌")
        setStudent(null)
      } else {
        setStudent(res.documents[0]) // ✅ show student
        setShowModal(true)
        const studentData = res.documents[0]

// 🔵 FETCH EXAM RESULT
try {
  const examRes = await databases.listDocuments(
    DATABASE_ID,
    "exam_results",
    [
      Query.equal("studentName", studentData.studentName),
Query.equal("course", studentData.courseName)
    ]
  )

  if (examRes.documents.length) {
    setExam(examRes.documents[0])
  }

} catch (err) {
  console.log("Exam fetch error:", err)
}

// 🟣 FETCH FRANCHISE
try {
  const franRes = await databases.listDocuments(
    DATABASE_ID,
    "franchise_approved",
    [
    Query.equal("instituteName", studentData.instituteName)
    ]
  )

  if (franRes.documents.length) {
    setFranchiseData(franRes.documents[0])
  }

} catch (err) {
  console.log("Franchise fetch error:", err)
}
        setFranchise(null)
      }

    } catch (err) {
      console.log(err)
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

              {/* OLD LOGIN KEPT BUT NOT USED */}
              {/* 
              <input placeholder="Username" />
              <input type="password" placeholder="Password" />
              */}

              {/* ✅ NEW FIELD */}
              <input
                placeholder="Enter Certificate Number"
                value={certificateNo}
                onChange={(e)=>setCertificateNo(e.target.value)}
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
{showModal && student && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">

    {/* CARD */}
    <div className="relative w-[95%] max-w-3xl rounded-3xl p-8 shadow-2xl
    bg-gradient-to-br from-indigo-100 via-white to-blue-100 border border-gray-200">

      {/* CLOSE */}
      <button
        onClick={() => setShowModal(false)}
        className="absolute top-4 right-5 text-2xl text-gray-500 hover:text-red-500"
      >
        ✕
      </button>

      {/* HEADER */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-extrabold text-green-600">
          ✔ Verified Student
        </h2>
        <p className="text-gray-500 text-sm">
          Official BNMI Verification
        </p>
      </div>

      {/* PROFILE */}
      <div className="flex flex-col items-center gap-3 mb-6">

        {student.photoId && (
          <img
            src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/6986e8a4001925504f6b/files/${student.photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
            className="w-32 h-32 rounded-full border-4 border-indigo-500 shadow-lg"
          />
        )}

        <h3 className="text-2xl font-bold text-gray-800">
          {student.studentName}
        </h3>

        {/* COURSE */}
        <span className="bg-indigo-600 text-white px-5 py-1 rounded-full text-sm font-semibold shadow">
          {student.courseName}
        </span>

      </div>

      {/* 🔵 STUDENT DETAILS */}
      <div className="bg-white rounded-2xl p-5 shadow-md border mb-5">

        <h3 className="text-lg font-bold text-indigo-600 mb-3 border-b pb-1">
          Student Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">

          <p><b>Admission Date:</b> {student.admissionDate}</p>
          <p><b>Duration:</b> {student.duration || "6 Months"}</p>

          <p><b>Certificate No:</b> {student.certificateNo}</p>
          <p><b>Grade:</b> {exam?.grade || "—"}</p>

          <p className="md:col-span-2">
            <b>Percentage:</b> {exam?.percentage ? `${exam.percentage}%` : "—"}
          </p>

        </div>

      </div>

      {/* 🟣 FRANCHISE DETAILS */}
      <div className="bg-white rounded-2xl p-5 shadow-md border">

        <h3 className="text-lg font-bold text-purple-600 mb-3 border-b pb-1">
          Franchise Details
        </h3>

        {/* LOGO */}
        {franchiseData?.logo && (
          <div className="flex justify-center mb-4">
            <img
              src={
                franchiseData.logo.startsWith("http")
                  ? franchiseData.logo
                  : `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/6986e8a4001925504f6b/files/${franchiseData.logo}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
              }
              className="w-20 h-20 object-contain drop-shadow-md"
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">

          <p><b>Institute:</b> {student.instituteName}</p>
          <p><b>Email:</b> {franchiseData?.email || "—"}</p>

          <p><b>Phone:</b> {franchiseData?.mobile || "—"}</p>

          <p className="md:col-span-2">
            <b>Address:</b>{franchiseData?.city} {franchiseData?.address || "Not Available"}
          </p>

        </div>

      </div>

    </div>
  </div>
)}
      </div>

    </div>
  )
}