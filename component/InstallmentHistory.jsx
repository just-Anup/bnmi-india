"use client"

import { useEffect, useState } from "react"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"
import { generateReceipt } from "@/lib/generateReceipt"
import { deleteInstallment, editInstallment } from "@/lib/installmentActions"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION = "student_installments"

export default function InstallmentHistory({ student }) {
  const [data, setData] = useState([])

  const fetchData = async () => {
    if (!student?.$id) return

    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION,
      [Query.equal("studentId", String(student.$id))]
    )

    setData(res.documents)
  }

  useEffect(() => {
    fetchData()
  }, [student])

  const handleDelete = async (item) => {
    if (!confirm("Delete installment?")) return
    await deleteInstallment(item, student)
    fetchData()
  }

  const handleEdit = async (item) => {
    const newAmount = prompt("New amount", item.amount)
    if (!newAmount) return
    await editInstallment(item, student, newAmount)
    fetchData()
  }

  const totalPaid = data.reduce((sum, i) => sum + i.amount, 0)

  return (
    <div className="mt-6 bg-white p-4 rounded-xl shadow">

      <div className="flex justify-between mb-4">
        <h3 className="font-bold">
          Installment History - {student?.studentName}
        </h3>

        <div className="text-green-700 font-bold">
          Total Paid: ₹{totalPaid}
        </div>
      </div>

      <table className="w-full text-center border">
        <thead className="bg-gray-100">
          <tr>
            <th>Date</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={item.$id} className="border-t">

              <td>{new Date(item.date).toLocaleDateString()}</td>

              <td className="text-green-600">₹{item.amount}</td>

              <td>{item.method}</td>

              <td className="flex justify-center gap-2 py-2">

                <button
                  onClick={() => generateReceipt(student, item)}
                  className="bg-green-600 text-white px-2 py-1 rounded"
                >
                  Receipt
                </button>

                <button
                  onClick={() => handleEdit(item)}
                  className="bg-yellow-500 text-white px-2 py-1 rounded"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(item)}
                  className="bg-red-600 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>

              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}