'use client'

import { useEffect, useState } from "react"
import { databases } from "@/lib/appwrite"
import { useRouter } from "next/navigation"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function WalletPage() {

  const [data, setData] = useState([])
  const router = useRouter()

  const fetchData = async () => {

    const res = await databases.listDocuments(
      DATABASE_ID,
      "franchise_approved"
    )

    setData(res.documents)
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (

    <div className="p-10">

      <h1 className="text-2xl font-bold mb-6">
        Franchise Wallet
      </h1>

      <table className="w-full border">

        <thead className="bg-yellow-200">
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Mobile</th>
            <th>Email</th>
            <th>Last Recharge</th>
            <th>Balance</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          {data.map((item, i) => (
            <tr key={item.$id} className="border text-center">

              <td>{i + 1}</td>
              <td>{item.instituteName}</td>
              <td>{item.mobile}</td>
              <td>{item.email}</td>
              <td>{item.lastRecharge || "-"}</td>
              <td>₹{item.wallet || "0.00"}</td>

              <td className="space-x-2">

                <button
                  onClick={() => router.push(`/admin/dashboard/wallet/recharge?id=${item.$id}`)}
                  className="bg-blue-500 text-white px-3 py-1"
                >
                  Recharge
                </button>

                <button className="bg-purple-500 text-white px-3 py-1">
                  View History
                </button>

              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  )
}