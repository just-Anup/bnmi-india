'use client'

import { useEffect, useState } from "react"
import { databases } from "@/lib/appwrite"
import { useParams } from "next/navigation"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function VerifyPage() {

  const { id } = useParams()

  const [data, setData] = useState(null)

  useEffect(() => {

    const fetchData = async () => {

      const res = await databases.getDocument(
        DATABASE_ID,
        "franchise_approved",
        id
      )

      setData(res)
    }

    fetchData()

  }, [])

  if (!data) return <div className="p-10">Loading...</div>

  return (

    <div className="p-10 flex justify-center">

      <div className="bg-white p-8 shadow-lg w-[500px] text-center">

        {/* LOGO */}
        {data.logo && (
          <img src={data.logo} className="h-20 mx-auto mb-4" />
        )}

        <h2 className="text-xl font-bold">{data.instituteName}</h2>

        {/* OWNER PHOTO */}
        {data.ownerPhoto && (
          <img src={data.ownerPhoto} className="h-24 w-24 rounded-full mx-auto mt-4" />
        )}

        <p className="mt-3 font-semibold">{data.name}</p>

        <p>ATC: {data.atcCode}</p>
        <p>Email: {data.email}</p>
        <p>Mobile: {data.mobile}</p>

        <p className="mt-3">
          {data.address}, {data.city}, {data.state} - {data.pincode}
        </p>

      </div>

    </div>

  )
}