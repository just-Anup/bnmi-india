"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const router = useRouter();
  const [student, setStudent] = useState(null);
  const [certData, setCertData] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem("student");

    if (!data) {
      router.push("/student/login");
    } else {
      setStudent(JSON.parse(data));
    }
  }, []);
  useEffect(() => {
  const data = localStorage.getItem("student");

  if (!data) {
    router.push("/student/login");
  } else {
    const parsed = JSON.parse(data);
    setStudent(parsed);

    loadCertificate(parsed.$id); // 🔥 IMPORTANT
  }
}, []);

 
const calculateAge = (dob) => {
  if (!dob) return "-";

  const birth = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

const loadCertificate = async (studentId) => {
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      "certificates",
      [
        Query.equal("studentId", studentId),
        Query.equal("status", "approved")
      ]
    );

    if (res.documents.length > 0) {
      setCertData(res.documents[0]);
    }
  } catch (err) {
    console.log("CERT FETCH ERROR:", err);
  }
};

 if (!student) return null;
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">
          Welcome, {student.studentName}
        </h1>
        <p className="text-gray-500 text-sm">
          Manage your courses, results and progress
        </p>
      </div>

      8638609354

      {/* TOP GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* REFER CARD */}
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="font-medium text-gray-700 mb-2">
            Refer & Earn
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Invite your friends and earn rewards.
          </p>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Code: MS905IT7
            </span>

            <button className="bg-gray-900 text-white px-3 py-1 rounded-md text-sm">
              Share
            </button>
          </div>
        </div>

        {/* WALLET */}
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-gray-600 text-sm mb-2">
            Wallet Balance
          </h2>
          <h1 className="text-2xl font-semibold mb-3">
            ₹0.00
          </h1>

          <button className="bg-black text-white px-4 py-2 rounded-md text-sm">
            Recharge
          </button>
        </div>

        {/* REFERRAL AMOUNT */}
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-gray-600 text-sm mb-2">
            Referral Earnings
          </h2>
          <h1 className="text-2xl font-semibold mb-3">
            ₹0.00
          </h1>

          <button className="border px-4 py-2 rounded-md text-sm">
            View History
          </button>
        </div>

      </div>

      {/* 🔷 STUDENT PROFILE CARD */}
<div className="bg-white border rounded-xl p-6 shadow-sm">

  <h2 className="text-lg font-semibold mb-4">
    Student Information
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">

    <div>
      <p className="text-gray-500">Student Name</p>
      <p className="font-medium">{student.studentName}</p>
    </div>

    <div>
      <p className="text-gray-500">Father Name</p>
      <p className="font-medium">{student.fatherName || "-"}</p>
    </div>

    <div>
      <p className="text-gray-500">Mother Name</p>
      <p className="font-medium">{student.motherName || "-"}</p>
    </div>

    <div>
      <p className="text-gray-500">Roll Number</p>
      <p className="font-medium">{student.rollNumber || "-"}</p>
    </div>

    <div>
      <p className="text-gray-500">Age</p>
      <p className="font-medium">{calculateAge(student.dob)}</p>
    </div>

    <div>
      <p className="text-gray-500">Mobile</p>
      <p className="font-medium">{student.mobile}</p>
    </div>

    <div className="md:col-span-2">
      <p className="text-gray-500">Address</p>
      <p className="font-medium">{student.address || "-"}</p>
    </div>

    <div>
      <p className="text-gray-500">Institute</p>
      <p className="font-medium">
        {student.instituteName || "-"}
      </p>
    </div>

    <div className="md:col-span-3">
      <p className="text-gray-500">Subjects</p>
      <p className="font-medium">
        {student.subjects || "-"}
      </p>
    </div>

  </div>
</div>

      {/* COURSES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* COURSE CARD */}
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="font-medium text-gray-800 mb-2">
            {student.courseName}
          </h2>

          <p className="text-sm text-gray-500 mb-2">
            Joined: 24 April 2026
          </p>

          <p className="text-sm text-red-500 mb-4">
            Exam Status: Appeared
          </p>

       <div className="flex gap-3 mb-4">

  {certData ? (
    <>
      <button
        onClick={() => openCertificate(certData)}
        className="bg-black text-white px-4 py-2 rounded-md text-sm"
      >
        Certificate
      </button>

      <button
        onClick={() => openMarksheet(certData)}
        className="border px-4 py-2 rounded-md text-sm"
      >
        Marksheet
      </button>
    </>
  ) : (
    <span className="text-sm text-gray-400">
      Certificate not available yet
    </span>
  )}

</div>

          <button className="w-full border py-2 rounded-md text-sm">
            Course Info
          </button>
        </div>

        {/* INSTALLMENT TABLE */}
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="font-medium text-gray-800 mb-4">
            Installments
          </h2>

          <table className="w-full text-sm">
            <thead className="text-gray-500 border-b">
              <tr>
                <th className="text-left py-2">#</th>
                <th className="text-left py-2">Installment</th>
                <th className="text-left py-2">Amount</th>
                <th className="text-left py-2">Date</th>
              </tr>
            </thead>

            <tbody>
              <tr className="border-b">
                <td className="py-2">1</td>
                <td>1st</td>
                <td>₹500</td>
                <td>2026-10-05</td>
              </tr>
            </tbody>
          </table>

          <p className="text-xs text-gray-500 mt-3">
            Contact support for practical exam details.
          </p>
        </div>

      </div>

      {/* FEES */}
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <h2 className="font-medium text-gray-800 mb-4">
          Fee Summary
        </h2>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Paid</p>
            <p className="font-medium">₹1000</p>
          </div>

          <div>
            <p className="text-gray-500">Balance</p>
            <p className="font-medium">₹4000</p>
          </div>

          <div>
            <p className="text-gray-500">Total</p>
            <p className="font-medium">₹5000</p>
          </div>
        </div>
      </div>

    </div>
  );
}