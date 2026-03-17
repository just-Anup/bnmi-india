'use client'

export const dynamic = "force-dynamic";

import { useState } from "react"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"
import { useRouter } from "next/navigation"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function VerifyHome() {

  const [atc, setAtc] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const router = useRouter()

  const handleSearch = async () => {

    if (!atc) {
      alert("Enter ATC Code")
      return
    }

    setLoading(true)

    try {

      const res = await databases.listDocuments(
        DATABASE_ID,
        "franchise_approved",
        [Query.equal("atcCode", atc)]
      )

      if (res.documents.length === 0) {
        alert("Invalid ATC Code ❌")
        setResult(null)
      } else {
        setResult(res.documents[0])
      }

    } catch (err) {
      console.error(err)
      alert("Search failed")
    }

    setLoading(false)
  }

  return (

    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">

      {/* HEADER */}
      <h1 className="text-3xl font-bold mb-2 text-center">
        BNMI Franchise Verification
      </h1>

      <p className="text-gray-600 mb-6 text-center">
        Enter ATC Code to verify franchise authenticity
      </p>

      {/* SEARCH BOX */}
      <div className="bg-white p-6 rounded-xl shadow-lg w-[400px]">

        <input
          type="text"
          placeholder="Enter ATC Code"
          value={atc}
          onChange={(e)=>setAtc(e.target.value)}
          className="w-full border p-3 rounded-lg mb-4"
        />

        <button
          onClick={handleSearch}
          className="w-full bg-black text-white py-3 rounded-lg"
        >
          {loading ? "Searching..." : "Verify"}
        </button>

      </div>

      {/* RESULT */}
      {result && (
        <div className="bg-white mt-8 p-6 rounded-xl shadow-lg w-[500px]">

          <h2 className="text-xl font-bold text-green-600 mb-4 text-center">
            ✔ Verified Franchise
          </h2>

          {result.logo && (
            <img src={result.logo} className="h-20 mx-auto mb-4" />
          )}

          {result.ownerPhoto && (
            <img
              src={result.ownerPhoto}
              className="h-24 w-24 rounded-full mx-auto mb-4"
            />
          )}

          <div className="space-y-2">

            <p><strong>Institute:</strong> {result.instituteName}</p>

            <p><strong>Owner:</strong> {result.name}</p>

            <p><strong>ATC Code:</strong> {result.atcCode}</p>

            <p><strong>Email:</strong> {result.email}</p>

            <p><strong>Mobile:</strong> {result.mobile}</p>

            <p>
              <strong>Address:</strong><br />
              {result.address}, {result.city}, {result.state} - {result.pincode}
            </p>

          </div>

          {/* VIEW FULL PAGE */}
          <button
            onClick={() => router.push(`/verify/${result.$id}`)}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded"
          >
            View Full Details
          </button>

        </div>
      )}

    </div>
  )
}