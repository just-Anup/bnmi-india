'use client'

import { useEffect, useState } from "react"
import { databases, account } from "@/lib/appwrite"
import { Query } from "appwrite"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function CourierWalletPage() {

  const [wallet, setWallet] = useState(0)
  const [lastRecharge, setLastRecharge] = useState("")
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    fetchWallet()
  }, [])

  const fetchWallet = async () => {

    const user = await account.get()

    // 🔥 GET FRANCHISE DATA
    const res = await databases.listDocuments(
      DATABASE_ID,
      "franchise_approved",
      [Query.equal("email", user.email)]
    )

    const franchise = res.documents[0]

    setWallet(franchise.courierWallet || 0)
    setLastRecharge(franchise.lastCourierRecharge || "-")

    // 🔥 GET COURIER TRANSACTIONS
    const txn = await databases.listDocuments(
      DATABASE_ID,
      "courier_transactions",
      [Query.equal("franchiseId", franchise.$id)]
    )

    setTransactions(txn.documents)
  }

  return (

    <div className="p-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">
        Courier Wallet
      </h1>

      {/* Wallet Card */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">

        <h2 className="text-lg text-gray-500 mb-2">
          Available Balance
        </h2>

        <p className="text-4xl font-bold text-blue-600">
          ₹{wallet}
        </p>

        <p className="text-sm text-gray-400 mt-2">
          Last Recharge: {lastRecharge}
        </p>

      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl shadow-md p-6">

        <h2 className="text-lg font-semibold mb-4">
          Courier Transactions
        </h2>

        <div className="space-y-3">

          {transactions.length === 0 && (
            <p className="text-gray-400">No transactions found</p>
          )}

          {transactions.map((item) => (

            <div
              key={item.$id}
              className="flex justify-between items-center border-b pb-2"
            >

              <div>
                <p className="font-medium">
                  {item.reason || "Transaction"}
                </p>

                <p className="text-sm text-gray-400">
                  {new Date(item.date).toLocaleString()}
                </p>
              </div>

              <p className={`font-bold ${
                item.type === "add"
                  ? "text-green-600"
                  : "text-red-600"
              }`}>
                {item.type === "add" ? "+" : "-"} ₹{item.amount}
              </p>

            </div>

          ))}

        </div>

      </div>

    </div>
  )
}