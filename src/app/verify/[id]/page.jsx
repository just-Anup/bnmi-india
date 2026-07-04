'use client'

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react"
import { databases } from "@/lib/appwrite"
import { useParams } from "next/navigation"

import {
  FaCheckCircle,
  FaUniversity,
  FaUserTie,
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaIdCard,
} from "react-icons/fa"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function VerifyPage() {

  const { id } = useParams()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const fetchData = async () => {
      try {

        const res = await databases.getDocument(
          DATABASE_ID,
          "franchise_approved",
          id
        )

        setData(res)

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

  }, [id])

  if (loading) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-semibold tracking-wide">
          Verifying Franchise...
        </p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center px-4">
        <div className="bg-white/10 backdrop-blur-xl border border-red-500/30 p-10 rounded-3xl text-center shadow-2xl">
          <h1 className="text-3xl font-bold text-red-500 mb-3">
            Invalid Certificate
          </h1>

          <p className="text-gray-300 text-lg">
            Franchise record not found ❌
          </p>
        </div>
      </div>
    )
  }

  return (

    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">

      <div className="w-full max-w-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-[35px] overflow-hidden">

        {/* TOP HEADER */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-8 text-center relative">

          <div className="absolute top-4 right-4 bg-white text-green-600 px-4 py-1 rounded-full text-sm font-bold shadow-lg">
            VERIFIED
          </div>

          {/* LOGO */}
          {data.logo && (
            <div className="bg-white w-28 h-28 rounded-full flex items-center justify-center mx-auto shadow-2xl border-4 border-white overflow-hidden mb-5">
              <img
                src={data.logo}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
          )}

          <h1 className="text-4xl font-extrabold text-white tracking-wide">
            Franchise Verification
          </h1>

          <p className="text-white/90 mt-2 text-lg">
            Official Verified Franchise Certificate
          </p>

          <div className="flex items-center justify-center gap-2 mt-4 text-white font-semibold">
            <FaCheckCircle className="text-2xl" />
            Successfully Verified
          </div>

        </div>

        {/* BODY */}
        <div className="p-8 md:p-10 text-white">

          
         {/* OWNER IMAGE */}
{data.ownerPhoto && (
  <div className="flex justify-center mt-[-80px] md:mt-[-80px] mb-8 relative z-20">

    <div className="bg-white p-2 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)]">

      <img
        src={data.ownerPhoto}
        alt="Owner"
        className="h-36 w-36 rounded-full object-cover border-[5px] border-green-500"
      />

    </div>

  </div>
)}
          {/* DETAILS GRID */}
          <div className="grid md:grid-cols-2 gap-5">

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">

              <div className="flex items-center gap-3 mb-2">
                <FaUniversity className="text-green-400 text-xl" />
                <h2 className="font-semibold text-lg">Institute Name</h2>
              </div>

              <p className="text-gray-300 break-words">
                {data.instituteName}
              </p>

            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">

              <div className="flex items-center gap-3 mb-2">
                <FaUserTie className="text-green-400 text-xl" />
                <h2 className="font-semibold text-lg">Owner Name</h2>
              </div>

              <p className="text-gray-300 break-words">
                {data.name}
              </p>

            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">

              <div className="flex items-center gap-3 mb-2">
                <FaIdCard className="text-green-400 text-xl" />
                <h2 className="font-semibold text-lg">ATC Code</h2>
              </div>

              <p className="text-gray-300 break-words">
                {data.atcCode}
              </p>

            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">

              <div className="flex items-center gap-3 mb-2">
                <FaEnvelope className="text-green-400 text-xl" />
                <h2 className="font-semibold text-lg">Email Address</h2>
              </div>

              <p className="text-gray-300 break-words">
                {data.email}
              </p>

            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">

              <div className="flex items-center gap-3 mb-2">
                <FaPhoneAlt className="text-green-400 text-xl" />
                <h2 className="font-semibold text-lg">Mobile Number</h2>
              </div>

              <p className="text-gray-300 break-words">
                {data.mobile}
              </p>

            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">

              <div className="flex items-center gap-3 mb-2">
                <FaMapMarkerAlt className="text-green-400 text-xl" />
                <h2 className="font-semibold text-lg">Address</h2>
              </div>

              <p className="text-gray-300 break-words leading-7">
                {data.address}, {data.city}, {data.state} - {data.pincode}
              </p>

            </div>

          </div>

          {/* FOOTER */}
          <div className="mt-10 border-t border-white/10 pt-6 text-center">

            <p className="text-green-400 font-bold text-lg">
              ✔ Franchise Verified by BNMI
            </p>

            <p className="text-gray-400 mt-2 text-sm">
              This certificate confirms that the franchise is officially approved and verified.
            </p>

          </div>

        </div>

      </div>

    </div>
  )
}