'use client'

import { useEffect, useState, use } from "react"
import { databases } from "@/lib/appwrite"
import { useRouter } from "next/navigation"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function CourierRechargePage({ params }) {

  const router = useRouter()
  const { id } = use(params)

  const [user, setUser] = useState(null)
  const [amount, setAmount] = useState("")
  const [paymentMode, setPaymentMode] = useState("")
  const [rechargeBy, setRechargeBy] = useState("")
  const [remarks, setRemarks] = useState("")
  const [masterPassword, setMasterPassword] = useState("")
  const [enable, setEnable] = useState(false)

  useEffect(() => {
    setEnable(masterPassword === "6969")
  }, [masterPassword])

  useEffect(() => {
    const fetchUser = async () => {
      const res = await databases.getDocument(
        DATABASE_ID,
        "franchise_approved",
        id
      )
      setUser(res)
    }

    if (id) fetchUser()
  }, [id])

  const handleRecharge = async () => {

    if (!amount) return alert("Enter amount")

    try {

      const newBalance = Number(user.courierWallet || 0) + Number(amount)

      await databases.updateDocument(
        DATABASE_ID,
        "franchise_approved",
        id,
        {
          courierWallet: newBalance.toFixed(2),
          lastCourierRecharge: new Date().toLocaleString()
        }
      )

      await databases.createDocument(
        DATABASE_ID,
        "courier_transactions",
        "unique()",
        {
          franchiseId: id,
          amount,
          type: "add",
          paymentMode,
          rechargeBy,
          remarks,
          date: new Date().toISOString()
        }
      )

      alert("Courier Recharge Successful")
      router.push("/admin/dashboard/courier-wallet")

    } catch (err) {
      console.error(err)
      alert("Recharge failed")
    }
  }

  if (!user) return <div className="p-10">Loading...</div>

  return (

    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">

      {/* Card */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            Courier Wallet Recharge
          </h1>
          <p className="text-sm text-gray-500">
            Add balance to franchise courier wallet
          </p>
        </div>

        {/* Form */}
        <div className="space-y-5">

          {/* Amount */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Enter Amount
            </label>
            <input
              type="number"
              placeholder="₹ 0.00"
              onChange={(e)=>setAmount(e.target.value)}
              className="w-full mt-1 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Franchise Name */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Franchise Name
            </label>
            <input
              value={user.instituteName}
              disabled
              className="w-full mt-1 border rounded-lg p-3 bg-gray-100"
            />
          </div>

          {/* Payment Mode */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Payment Mode
            </label>
            <select
              onChange={(e)=>setPaymentMode(e.target.value)}
              className="w-full mt-1 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Payment Mode</option>
              <option value="Online">Online</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          {/* Recharge By */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Recharge By
            </label>
            <input
              placeholder="Enter name"
              onChange={(e)=>setRechargeBy(e.target.value)}
              className="w-full mt-1 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Master Password */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Master Password
            </label>
            <input
              type="password"
              placeholder="Enter master password"
              onChange={(e)=>setMasterPassword(e.target.value)}
              className="w-full mt-1 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Remarks
            </label>
            <textarea
              placeholder="Optional notes..."
              onChange={(e)=>setRemarks(e.target.value)}
              className="w-full mt-1 border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-8">

          <button
            onClick={()=>router.back()}
            className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition"
          >
            Cancel
          </button>

          <button
            disabled={!enable}
            onClick={handleRecharge}
            className={`px-6 py-2 rounded-lg text-white transition ${
              enable
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Make Payment
          </button>

        </div>

      </div>

    </div>
  )
}