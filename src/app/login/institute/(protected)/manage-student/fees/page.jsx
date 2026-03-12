"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useRouter } from "next/navigation";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const ADMISSION_COLLECTION = "student_admissions";
const PAYMENT_COLLECTION = "student_payments";

export default function PaymentList() {

  const router = useRouter();

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({
    totalFees: 0,
    paidFees: 0,
    balanceFees: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {

    try {

      const user = await account.get();

      const admissions = await databases.listDocuments(
        DATABASE_ID,
        ADMISSION_COLLECTION,
        [Query.equal("createdById", user.$id)]
      );

      const payments = await databases.listDocuments(
        DATABASE_ID,
        PAYMENT_COLLECTION,
        [Query.equal("createdById", user.$id)]
      );

      /* Create payment map */

      const paymentMap = {};

      payments.documents.forEach((p) => {

        if (!paymentMap[p.admissionId]) {
          paymentMap[p.admissionId] = [];
        }

        paymentMap[p.admissionId].push(p);

      });

      /* Format records */

      const formatted = admissions.documents.map((adm) => {

        const studentPayments = paymentMap[adm.$id] || [];

        const paid = studentPayments.reduce(
          (sum, p) => sum + Number(p.paymentAmount || 0),
          0
        );

        const lastPayment = studentPayments[studentPayments.length - 1];

        const total = Number(adm.totalFees || 0);
        const balance = total - paid;

        return {
          ...adm,
          total,
          paid,
          balance,
          paymentId: lastPayment ? lastPayment.$id : null
        };

      });

      /* Summary */

      const totalFees = formatted.reduce((s, r) => s + r.total, 0);
      const paidFees = formatted.reduce((s, r) => s + r.paid, 0);
      const balanceFees = formatted.reduce((s, r) => s + r.balance, 0);

      setRecords(formatted);

      setSummary({
        totalFees,
        paidFees,
        balanceFees
      });

    } catch (error) {

      console.error("Payment List Error:", error);

    }

  };

  return (

    <div className="p-10">

      {/* HEADER */}

      <div className="flex justify-between items-center mb-6">

        <h2 className="text-2xl font-bold">
          List Students Payments
        </h2>

        <div className="flex gap-4">

          <button
            onClick={() => router.push("/login/institute/manage-student/fees/add")}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add New Payment
          </button>

          <button className="bg-red-500 text-white px-4 py-2 rounded-md">
            Export
          </button>

        </div>

      </div>

      {/* SUMMARY */}

      <div className="text-right mb-6 font-semibold">

        <p>Paid Fees : ₹ {summary.paidFees}</p>
        <p>Balance Fees : ₹ {summary.balanceFees}</p>
        <p>Total Fees : ₹ {summary.totalFees}</p>

      </div>

      {/* TABLE */}

      <table className="w-full border border-gray-300 rounded-lg overflow-hidden">

        <thead className="bg-yellow-200">

          <tr>

            <th className="p-3 border">#</th>
            <th className="p-3 border">Student Name</th>
            <th className="p-3 border">Course Name</th>
            <th className="p-3 border text-center">Total Fees</th>
            <th className="p-3 border text-center">Fees Paid</th>
            <th className="p-3 border text-center">Balance</th>
            <th className="p-3 border text-center">Action</th>

          </tr>

        </thead>

        <tbody>

          {records.length === 0 ? (

            <tr>
              <td colSpan="7" className="text-center p-6">
                No Data Available
              </td>
            </tr>

          ) : (

            records.map((item, index) => (

              <tr key={item.$id} className="hover:bg-gray-50">

                <td className="p-3 border">{index + 1}</td>

                <td className="p-3 border font-medium">
                  {item.studentName}
                </td>

                <td className="p-3 border">
                  {item.course}
                </td>

                <td className="p-3 border text-center">
                  ₹ {item.total}
                </td>

                <td className="p-3 border text-green-600 text-center font-semibold">
                  ₹ {item.paid}
                </td>

                <td className="p-3 border text-red-600 text-center font-semibold">
                  ₹ {item.balance}
                </td>

                <td className="p-3 border text-center">

                  {item.paymentId ? (

                    <button
                      onClick={() => router.push(`/login/institute/manage-student/fees/receipt/${item.paymentId}`)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      View
                    </button>

                  ) : (

                    <span className="text-gray-400 text-sm">
                      No Receipt
                    </span>

                  )}

                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>

  );

}