'use client'

import { useEffect, useState } from "react"
import { databases, account } from "@/lib/appwrite"
import { ID, Query } from "appwrite"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function RechargeRequestPage() {

  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [transactionId, setTransactionId] = useState("")
  const [requests, setRequests] = useState([])
  const [franchiseId, setFranchiseId] = useState("")

  useEffect(() => {
    init()
  }, [])

  const init = async () => {

    const user = await account.get()

    const res = await databases.listDocuments(
      DATABASE_ID,
      "franchise_approved",
      [Query.equal("email", user.email)]
    )

    const franchise = res.documents[0]
    setFranchiseId(franchise.$id)

    fetchRequests(franchise.$id)
  }

  const fetchRequests = async (id) => {

    const res = await databases.listDocuments(
      DATABASE_ID,
      "recharge_requests",
      [Query.equal("franchiseId", id)]
    )

    setRequests(res.documents)
  }

  // 🔥 SUBMIT REQUEST
  const handleSubmit = async () => {

    if (!amount || !paymentMethod) {
      alert("Fill all fields")
      return
    }

    try {

      await databases.createDocument(
        DATABASE_ID,
        "recharge_requests",
        ID.unique(),
        {
          franchiseId,
          amount,
          paymentMethod,
          transactionId,
          status: "Pending",
          date: new Date().toISOString()
        }
      )

      alert("Request Submitted")

      setAmount("")
      setPaymentMethod("")
      setTransactionId("")

      fetchRequests(franchiseId)

    } catch (err) {
      console.error(err)
      alert("Failed to submit")
    }
  }

  return (

    <div className="p-6 bg-gray-50 min-h-screen">

      <h1 className="text-3xl font-semibold mb-6">
        Recharge Request
      </h1>

      {/* FORM */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">

        <h2 className="text-lg font-semibold mb-4">
          Request Recharge
        </h2>

        <div className="grid grid-cols-3 gap-4">

          <input
            placeholder="Enter Amount"
            value={amount}
            onChange={(e)=>setAmount(e.target.value)}
            className="border p-3 rounded"
          />

          <select
            value={paymentMethod}
            onChange={(e)=>setPaymentMethod(e.target.value)}
            className="border p-3 rounded"
          >
            <option value="">Payment Method</option>
            <option>UPI</option>
            <option>Bank Transfer</option>
            <option>Cash</option>
          </select>

          <input
            placeholder="Transaction ID (optional)"
            value={transactionId}
            onChange={(e)=>setTransactionId(e.target.value)}
            className="border p-3 rounded"
          />

        </div>

        <button
          onClick={handleSubmit}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded"
        >
          Submit Request
        </button>

      </div>

      {/* LIST */}
      <div className="bg-white p-6 rounded-xl shadow">

        <h2 className="text-lg font-semibold mb-4">
          My Requests
        </h2>

        <div className="space-y-3">

          {requests.length === 0 && (
            <p className="text-gray-400">No requests found</p>
          )}

          {requests.map((item) => (

            <div
              key={item.$id}
              className="flex justify-between items-center border-b pb-2"
            >

              <div>
                <p className="font-medium">
                  ₹{item.amount} ({item.paymentMethod})
                </p>

                <p className="text-sm text-gray-400">
                  {new Date(item.date).toLocaleString()}
                </p>
              </div>

              {/* STATUS */}
              <span className={`px-3 py-1 rounded text-xs font-semibold ${
                item.status === "Approved"
                  ? "bg-green-100 text-green-600"
                  : item.status === "Rejected"
                  ? "bg-red-100 text-red-600"
                  : "bg-yellow-100 text-yellow-600"
              }`}>
                {item.status}
              </span>

            </div>

          ))}

        </div>

      </div>

    </div>
  )
}