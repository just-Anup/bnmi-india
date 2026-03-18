'use client'

import { useEffect, useState } from "react"
import { databases } from "@/lib/appwrite"
import { useRouter } from "next/navigation"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function CourierWalletPage() {

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

    <div className="p-6 bg-gray-50 min-h-screen">

      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">
          Courier Wallet
        </h1>
        <p className="text-gray-500 text-sm">
          Manage courier wallet balances
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="p-4 text-left">#</th>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Mobile</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Last Recharge</th>
              <th className="p-4 text-left">Balance</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>

          <tbody>

            {data.map((item, i) => (
              <tr key={item.$id} className="border-t hover:bg-gray-50">

                <td className="p-4">{i + 1}</td>
                <td className="p-4 font-semibold">{item.instituteName}</td>
                <td className="p-4">{item.mobile}</td>
                <td className="p-4">{item.email}</td>

                <td className="p-4">
                  {item.lastCourierRecharge || "-"}
                </td>

                <td className="p-4">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">
                    ₹{item.courierWallet || "0.00"}
                  </span>
                </td>

                <td className="p-4 text-center space-x-2">

                  <button
                    onClick={() => router.push(`/admin/dashboard/courier-wallet/recharge/${item.$id}`)}
                    className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs"
                  >
                    Recharge
                  </button>

                  <button className="bg-gray-200 px-4 py-1.5 rounded-lg text-xs">
                    History
                  </button>

                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  )
}