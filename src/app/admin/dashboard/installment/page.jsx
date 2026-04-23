"use client"

import { useEffect, useMemo, useState } from "react"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"
import { utils, writeFile } from "xlsx"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const INSTALLMENT_COLLECTION = "student_installments"
const STUDENT_COLLECTION = "student_admissions"

export default function AdminInstallmentsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      setLoading(true)

      // ✅ 1. Fetch ALL installments (pagination safe)
      const instRes = await databases.listDocuments(
        DATABASE_ID,
        INSTALLMENT_COLLECTION,
        [Query.limit(1000)]
      )

      const installments = instRes.documents

      // ✅ 2. Fetch ALL students (pagination safe)
      const stuRes = await databases.listDocuments(
        DATABASE_ID,
        STUDENT_COLLECTION,
        [Query.limit(1000)]
      )

      const students = stuRes.documents

      // ✅ 3. Create map
      const studentMap = {}
      students.forEach((s) => {
        studentMap[String(s.$id)] = s
      })

      // ✅ 4. Merge safely
      const merged = installments.map((i) => {
        const student =
          studentMap[String(i.studentId)] ||
          students.find(
            (s) => String(s.$id) === String(i.studentId)
          ) ||
          {}

        return {
          id: i.$id,
          studentName: student.studentName || "N/A",
          franchiseName: student.instituteName || "N/A",
          amount: i.amount || 0,
          totalFees: student.totalFees || 0,
          balance: student.balance || 0,
          date: i.date,
        }
      })

      setRows(merged)

    } catch (e) {
      console.error("ADMIN ERROR:", e)
    } finally {
      setLoading(false)
    }
  }

  // 🔍 FILTER
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchSearch =
        r.studentName.toLowerCase().includes(search.toLowerCase()) ||
        r.franchiseName.toLowerCase().includes(search.toLowerCase())

      const d = new Date(r.date)
      const fromOk = fromDate ? d >= new Date(fromDate) : true
      const toOk = toDate ? d <= new Date(toDate) : true

      return matchSearch && fromOk && toOk
    })
  }, [rows, search, fromDate, toDate])

  // 📊 SUMMARY
  const totalRevenue = filtered.reduce((s, r) => s + r.amount, 0)
  const totalPending = filtered.reduce((s, r) => s + r.balance, 0)
  const totalStudents = new Set(filtered.map((r) => r.studentName)).size

  // 📥 EXPORT
  const exportExcel = () => {
    const sheet = utils.json_to_sheet(
      filtered.map((r) => ({
        Franchise: r.franchiseName,
        Student: r.studentName,
        Amount: r.amount,
        TotalFees: r.totalFees,
        Balance: r.balance,
        Date: new Date(r.date).toLocaleDateString(),
      }))
    )

    const wb = utils.book_new()
    utils.book_append_sheet(wb, sheet, "Installments")

    writeFile(wb, "Installments_Report.xlsx")
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Admin Installments Dashboard
        </h1>

        <button
          onClick={exportExcel}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Export Excel
        </button>
      </div>

      {/* 📊 STATS */}
      <div className="grid grid-cols-3 gap-4 mb-6">

        <div className="bg-white p-4 rounded-xl shadow">
          <h4>Total Students</h4>
          <p className="text-xl font-bold">{totalStudents}</p>
        </div>

        <div className="bg-green-100 p-4 rounded-xl shadow">
          <h4>Total Revenue</h4>
          <p className="text-xl font-bold">₹{totalRevenue}</p>
        </div>

        <div className="bg-red-100 p-4 rounded-xl shadow">
          <h4>Pending Amount</h4>
          <p className="text-xl font-bold">₹{totalPending}</p>
        </div>

      </div>

      {/* 🔍 FILTERS */}
      <div className="bg-white p-4 rounded-xl shadow mb-6 flex gap-4 flex-wrap">

        <input
          placeholder="Search student or franchise..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded w-[250px]"
        />

        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="border px-3 py-2 rounded"
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="border px-3 py-2 rounded"
        />

      </div>

      {/* 📋 TABLE */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">

        <table className="w-full text-center">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Franchise</th>
              <th>Student</th>
              <th>Amount</th>
              <th>Total Fees</th>
              <th>Remaining</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="p-6">Loading...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-6 text-gray-500">
                  No Data Found
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-t">

                  <td className="p-3 font-medium">
                    {r.franchiseName}
                  </td>

                  <td>{r.studentName}</td>

                  <td className="text-green-600 font-semibold">
                    ₹{r.amount}
                  </td>

                  <td>₹{r.totalFees}</td>

                  <td className="text-red-500">
                    ₹{r.balance}
                  </td>

                  <td>
                    {new Date(r.date).toLocaleDateString()}
                  </td>

                </tr>
              ))
            )}
          </tbody>

        </table>

      </div>

    </div>
  )
}