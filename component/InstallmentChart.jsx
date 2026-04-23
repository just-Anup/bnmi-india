"use client"

import { useEffect, useState } from "react"
import { databases, account } from "@/lib/appwrite"
import { Query } from "appwrite"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

export default function PieChartBox() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const user = await account.get()

    const franchiseRes = await databases.listDocuments(
      DATABASE_ID,
      "franchise_approved",
      [Query.equal("email", user.email)]
    )

    const franchiseId = franchiseRes.documents[0].$id

    const res = await databases.listDocuments(
      DATABASE_ID,
      "student_admissions",
      [Query.equal("franchiseId", franchiseId)]
    )

    let paid = 0
    let pending = 0

    res.documents.forEach((s) => {
      paid += s.feesReceived || 0
      pending += s.balance || 0
    })

    setData([
      { name: "Paid", value: paid },
      { name: "Pending", value: pending },
    ])
  }

  const COLORS = ["#22c55e", "#ef4444"]

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h3 className="font-bold mb-3">Payment Overview</h3>

      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} dataKey="value" outerRadius={80}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}