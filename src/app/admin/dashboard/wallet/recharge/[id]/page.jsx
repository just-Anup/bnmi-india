'use client'

import { useEffect, useState } from "react"
import { databases } from "@/lib/appwrite"
import { useRouter } from "next/navigation"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function RechargePage({ params }) {

  const router = useRouter()
  const id = params.id

  const [user, setUser] = useState(null)
  const [amount, setAmount] = useState("")
  const [paymentMode, setPaymentMode] = useState("")
  const [rechargeBy, setRechargeBy] = useState("")
  const [leadBy, setLeadBy] = useState("")
  const [remarks, setRemarks] = useState("")
  const [masterPassword, setMasterPassword] = useState("")
  const [enable, setEnable] = useState(false)

  // 🔐 MASTER PASSWORD CHECK
  useEffect(() => {
    setEnable(masterPassword === "6969")
  }, [masterPassword])

  // 📥 FETCH USER
  useEffect(() => {

    const fetchUser = async () => {
      try {
        const res = await databases.getDocument(
          DATABASE_ID,
          "franchise_approved",
          id
        )
        setUser(res)
      } catch (err) {
        console.error(err)
        alert("User not found")
        router.push("/admin/dashboard/wallet")
      }
    }

    if (id) fetchUser()

  }, [id])

  // 💰 HANDLE RECHARGE
  const handleRecharge = async () => {

    if (!amount) return alert("Enter amount")

    try {

      const newBalance = Number(user.wallet || 0) + Number(amount)

      await databases.updateDocument(
        DATABASE_ID,
        "franchise_approved",
        id,
        {
          wallet: newBalance.toFixed(2),
          lastRecharge: new Date().toLocaleString()
        }
      )

      await databases.createDocument(
        DATABASE_ID,
        "wallet_transactions",
        "unique()",
        {
          franchiseId: id,
          amount,
          type: "add",
          paymentMode,
          rechargeBy,
          leadBy,
          remarks,
          date: new Date().toISOString()
        }
      )

      alert("Recharge Successful")
      router.push("/admin/dashboard/wallet")

    } catch (err) {
      console.error(err)
      alert("Recharge failed")
    }
  }

  if (!user) return <div className="p-10">Loading...</div>

  return (
    <div className="p-10">

      <h1 className="text-xl font-bold mb-6">
        Franchise Recharge
      </h1>

      <div className="grid grid-cols-2 gap-6">

        <input
          placeholder="Enter Amount"
          value={amount}
          onChange={(e)=>setAmount(e.target.value)}
          className="border p-3"
        />

        <input value="FRANCHISE" disabled className="border p-3" />

        <input
          value={user.instituteName}
          disabled
          className="border p-3"
        />

        <select
          onChange={(e)=>setPaymentMode(e.target.value)}
          className="border p-3"
        >
          <option value="">Select Payment Mode</option>
          <option value="Online">Online</option>
          <option value="Cash">Cash</option>
          <option value="Cheque">Cheque</option>
        </select>

        <input
          placeholder="Recharge By"
          onChange={(e)=>setRechargeBy(e.target.value)}
          className="border p-3"
        />

        <input
          placeholder="Lead By"
          onChange={(e)=>setLeadBy(e.target.value)}
          className="border p-3"
        />

        <input
          placeholder="Master Password"
          type="password"
          onChange={(e)=>setMasterPassword(e.target.value)}
          className="border p-3 col-span-2"
        />

        <textarea
          placeholder="Remarks"
          onChange={(e)=>setRemarks(e.target.value)}
          className="border p-3 col-span-2"
        />

      </div>

      <div className="mt-6 flex gap-4">

        <button
          onClick={()=>router.back()}
          className="bg-yellow-400 px-4 py-2"
        >
          Cancel
        </button>

        <button
          disabled={!enable}
          onClick={handleRecharge}
          className={`px-4 py-2 text-white ${enable ? "bg-blue-600" : "bg-gray-400"}`}
        >
          Make Payment
        </button>

      </div>

    </div>
  )
}