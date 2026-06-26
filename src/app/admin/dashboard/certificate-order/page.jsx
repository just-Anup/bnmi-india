"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

const ORDER_COLLECTION = "certificate_orders";
const RESULT_COLLECTION = "exam_results";

export default function OrderDetailsPage() {

  const { id } = useParams();

  const [loading, setLoading] = useState(true);

  const [order, setOrder] = useState(null);

  const [students, setStudents] = useState([]);

  useEffect(() => {
    loadOrder();
  }, []);

  const loadOrder = async () => {

  try {

    setLoading(true);

    // Load Order
    const orderDoc = await databases.getDocument(
      DATABASE_ID,
      ORDER_COLLECTION,
      id
    );

    setOrder(orderDoc);

    // If no result IDs
    if (
      !orderDoc.resultIds ||
      orderDoc.resultIds.length === 0
    ) {
      setStudents([]);
      return;
    }

    // Load Students using Result IDs
    const promises = orderDoc.resultIds.map(resultId =>
      databases.getDocument(
        DATABASE_ID,
        RESULT_COLLECTION,
        resultId
      )
    );

    const resultDocs = await Promise.all(promises);

    setStudents(resultDocs);

  } catch (error) {

    console.log("Load Order Error :", error);

  } finally {

    setLoading(false);

  }

};

if (loading) {

  return (

    <div className="min-h-screen flex items-center justify-center">

      <div className="text-xl font-semibold">
        Loading Order...
      </div>

    </div>

  );

}

return (

<div className="min-h-screen bg-gray-100 p-6">

  {/* HEADER */}

  <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">

    <div className="flex flex-col lg:flex-row justify-between gap-6">

      <div>

        <h1 className="text-3xl font-bold text-gray-800">

          Certificate Order Details

        </h1>

        <p className="text-gray-500 mt-2">

          View and Print Ordered Certificates

        </p>

      </div>

      <div>

        <span
          className={`px-5 py-2 rounded-full font-semibold ${
            order.status === "Printed"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >

          {order.status}

        </span>

      </div>

    </div>

  </div>

  {/* ORDER INFO */}

  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">

    <div className="bg-white rounded-xl shadow p-5">

      <div className="text-gray-500 text-sm">

        Order Number

      </div>

      <div className="font-bold text-lg mt-2">

        {order.orderNo}

      </div>

    </div>

    <div className="bg-white rounded-xl shadow p-5">

      <div className="text-gray-500 text-sm">

        Institute

      </div>

      <div className="font-bold text-lg mt-2">

        {order.instituteName}

      </div>

    </div>

    <div className="bg-white rounded-xl shadow p-5">

      <div className="text-gray-500 text-sm">

        Students

      </div>

      <div className="font-bold text-lg mt-2">

        {order.totalStudents}

      </div>

    </div>

    <div className="bg-white rounded-xl shadow p-5">

      <div className="text-gray-500 text-sm">

        Order Date

      </div>

      <div className="font-bold text-lg mt-2">

        {new Date(order.createdAt).toLocaleDateString()}

      </div>

    </div>

    <div className="bg-white rounded-xl shadow p-5">

      <div className="text-gray-500 text-sm">

        Franchise Email

      </div>

      <div className="font-bold text-sm mt-2 break-all">

        {order.franchiseEmail}

      </div>

    </div>

  </div>
    {/* STUDENT TABLE */}

  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

    <div className="overflow-x-auto">

      <table className="min-w-full">

        <thead className="bg-orange-500 text-white">

          <tr>

            <th className="p-4 text-left">#</th>

            <th className="p-4 text-left">Student Name</th>

            <th className="p-4 text-left">Student ID</th>

            <th className="p-4 text-left">Course</th>

            <th className="p-4 text-left">Grade</th>

            <th className="p-4 text-left">Exam Date</th>

            <th className="p-4 text-left">Action</th>

          </tr>

        </thead>

        <tbody>

          {students.length === 0 ? (

            <tr>

              <td
                colSpan={7}
                className="text-center py-10 text-gray-500"
              >
                No Students Found
              </td>

            </tr>

          ) : (

            students.map((student, index) => (

              <tr
                key={student.$id}
                className="border-b hover:bg-gray-50"
              >

                <td className="p-4">
                  {index + 1}
                </td>

                <td className="p-4 font-semibold">
                  {student.studentName}
                </td>

                <td className="p-4">
                  {student.studentId}
                </td>

                <td className="p-4">
                  {student.course}
                </td>

                <td className="p-4">

                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">

                    {student.grade}

                  </span>

                </td>

                <td className="p-4">

                  {student.examDate || "-"}

                </td>

                <td className="p-4">

                  <button
                    onClick={() =>
                      window.open(
                        `/login/admin/certificate/view/${student.studentId}`,
                        "_blank"
                      )
                    }
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                  >

                    Print

                  </button>

                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>

  </div>
  </div>

  );
  }
