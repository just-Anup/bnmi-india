"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { Query, ID } from "appwrite";
import { useRouter } from "next/navigation";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const ADMISSION_COLLECTION = "student_admissions";
const PAYMENT_COLLECTION = "student_payments";

export default function AddPayment() {

  const router = useRouter();

  const [admissions, setAdmissions] = useState([]);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [totalPaid, setTotalPaid] = useState(0);

  const [form, setForm] = useState({
    paymentAmount: "",
    paymentMode: "",
    notes: ""
  });

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const fetchAdmissions = async () => {

    const user = await account.get();

    const response = await databases.listDocuments(
      DATABASE_ID,
      ADMISSION_COLLECTION,
      [Query.equal("createdById", user.$id)]
    );

    setAdmissions(response.documents);

  };

  const handleAdmissionSelect = async (admissionId) => {

    const admission = await databases.getDocument(
      DATABASE_ID,
      ADMISSION_COLLECTION,
      admissionId
    );

    setSelectedAdmission(admission);

    const payments = await databases.listDocuments(
      DATABASE_ID,
      PAYMENT_COLLECTION,
      [Query.equal("admissionId", admissionId)]
    );

    const paid = payments.documents.reduce(
      (sum, item) => sum + Number(item.paymentAmount),
      0
    );

    setTotalPaid(paid);

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    const user = await account.get();

    await databases.createDocument(
      DATABASE_ID,
      PAYMENT_COLLECTION,
      ID.unique(),
      {
        createdById: user.$id,

        studentId: selectedAdmission.$id,
        admissionId: selectedAdmission.$id,
        studentName: selectedAdmission.studentName,
        course: selectedAdmission.course,

        paymentAmount: Number(form.paymentAmount),
        paymentMode: form.paymentMode,
        notes: form.notes,

        paymentDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    );

    alert("Payment Added Successfully");

    router.push("/login/institute/manage-student/fees");

  };

  const balance = selectedAdmission
    ? Number(selectedAdmission.totalFees) -
    totalPaid -
    Number(form.paymentAmount || 0)
    : 0;

  return (

    <div className="p-10 bg-gray-100 min-h-screen">

      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-8">

        <h2 className="text-2xl font-bold mb-8 border-b pb-4">
          Student Payment Details
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">

          {/* Student */}
          <div className="flex flex-col">
            <label className="font-semibold mb-1">
              Select Student & Course
            </label>

            <select
              onChange={(e) => handleAdmissionSelect(e.target.value)}
              className="border rounded-md p-2"
              required
            >
              <option value="">Select Student</option>

              {admissions.map((item) => (
                <option key={item.$id} value={item.$id}>
                  {item.studentName} - {item.course}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div className="flex flex-col">
            <label className="font-semibold mb-1">
              Payment Amount
            </label>

            <input
              type="number"
              onChange={(e) => setForm({ ...form, paymentAmount: e.target.value })}
              className="border rounded-md p-2"
              required
            />
          </div>

          {/* Mode */}
          <div className="flex flex-col">
            <label className="font-semibold mb-1">
              Payment Mode
            </label>

            <select
              onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
              className="border rounded-md p-2"
              required
            >
              <option value="">Select Mode</option>
              <option>Cash</option>
              <option>UPI</option>
              <option>Bank Transfer</option>
            </select>
          </div>

          {/* Notes */}
          <div className="flex flex-col">
            <label className="font-semibold mb-1">
              Notes
            </label>

            <input
              type="text"
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="border rounded-md p-2"
            />
          </div>

        </form>

        {/* Summary */}
        {selectedAdmission && (

          <div className="mt-6 bg-gray-50 p-4 rounded-lg border">

            <p>
              <strong>Total Course Fees :</strong> ₹ {selectedAdmission.totalFees}
            </p>

            <p>
              <strong>Already Paid :</strong> ₹ {totalPaid}
            </p>

            <p className="text-red-600 font-bold">
              Remaining Balance : ₹ {balance}
            </p>

          </div>

        )}

        <div className="flex gap-4 mt-8">

          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Add Payment
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="bg-red-500 text-white px-6 py-2 rounded-md"
          >
            Cancel
          </button>

        </div>

      </div>

    </div>

  );

}