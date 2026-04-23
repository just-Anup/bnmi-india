"use client"

import { useState } from "react"
import { addInstallment } from "@/lib/installment"

export default function AddInstallmentModal({ student, onClose, refresh }) {
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("Cash")

  const handleSubmit = async () => {
    if (!amount) return alert("Enter amount")

    const res = await addInstallment(student, amount, method)

    if (res.success) {
      refresh()
      onClose()
    } else {
      alert("Error adding installment")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-xl w-[300px]">

        <h2 className="font-bold mb-3">Add Installment</h2>

        <input
          type="number"
          placeholder="Amount"
          className="border p-2 w-full mb-3"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <select
          className="border p-2 w-full mb-3"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          <option>Cash</option>
          <option>UPI</option>
        </select>

        <div className="flex justify-between">
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Save
          </button>
        </div>

      </div>
    </div>
  )
}