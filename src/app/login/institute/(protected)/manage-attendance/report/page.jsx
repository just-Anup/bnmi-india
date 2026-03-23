"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const STUDENT_COLLECTION = "student_admissions";
const ATTENDANCE_COLLECTION = "attendance";

export default function AttendanceReport() {

  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // 🔥 LOAD BATCHES
  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    const user = await account.get();

    const res = await databases.listDocuments(
      DATABASE_ID,
      STUDENT_COLLECTION,
      [Query.equal("franchiseEmail", user.email)]
    );

    const uniqueBatches = [
      ...new Set(res.documents.map((doc) => doc.batch).filter(Boolean)),
    ];

    setBatches(uniqueBatches);
  };

  // 🔥 LOAD REPORT
  const loadReport = async () => {
    if (!selectedBatch) {
      alert("Select batch");
      return;
    }

    const user = await account.get();

    // STUDENTS
    const studentRes = await databases.listDocuments(
      DATABASE_ID,
      STUDENT_COLLECTION,
      [
        Query.equal("franchiseEmail", user.email),
        Query.equal("batch", selectedBatch),
      ]
    );

    setStudents(studentRes.documents);

    // ATTENDANCE
    const attendanceRes = await databases.listDocuments(
      DATABASE_ID,
      ATTENDANCE_COLLECTION,
      [
        Query.equal("batch", selectedBatch),
        Query.greaterThanEqual("date", startDate),
        Query.lessThanEqual("date", endDate),
      ]
    );

    setAttendance(attendanceRes.documents);
  };

  // 🔥 HELPER: GET STATUS
  const getStatus = (studentId, date) => {
    const record = attendance.find(
      (a) => a.studentId === studentId && a.date === date
    );
    return record ? record.status : "-";
  };

  // 🔥 GET UNIQUE DATES
  const uniqueDates = [
    ...new Set(attendance.map((a) => a.date)),
  ];

  return (
    <div className="p-8 bg-gray-100 rounded">

      <h1 className="text-2xl font-bold mb-6">
        ATTENDANCE REPORT
      </h1>

      {/* FILTER SECTION */}
      <div className="bg-white p-6 rounded shadow mb-6 grid grid-cols-4 gap-4">

        {/* Batch */}
        <div>
          <label className="font-semibold">Select Batch</label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="border p-2 w-full"
          >
            <option value="">Select</option>
            {batches.map((b, i) => (
              <option key={i}>{b}</option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="font-semibold">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border p-2 w-full"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="font-semibold">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border p-2 w-full"
          />
        </div>

        {/* Filter */}
        <div className="flex items-end">
          <button
            onClick={loadReport}
            className="bg-red-500 text-white px-6 py-2 rounded"
          >
            Filter
          </button>
        </div>

      </div>

      {/* TABLE */}
      {students.length > 0 && (
        <div className="bg-white p-6 rounded shadow overflow-x-auto">

          <table className="w-full border">

            <thead>
              <tr className="bg-green-500 text-white">
                <th className="p-2 border">S/N</th>
                <th className="p-2 border">Student Name</th>
                <th className="p-2 border">Course Name</th>

                {uniqueDates.map((date, i) => (
                  <th key={i} className="p-2 border">
                    {date}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {students.map((student, index) => (
                <tr key={student.$id}>
                  <td className="p-2 border">{index + 1}</td>

                  <td className="p-2 border">
                    {student.studentName}
                  </td>

                  <td className="p-2 border">
                    {student.courseName}
                  </td>

                  {uniqueDates.map((date, i) => (
                    <td
                      key={i}
                      className={`p-2 border text-center ${
                        getStatus(student.$id, date) === "Present"
                          ? "bg-green-200"
                          : getStatus(student.$id, date) === "Absent"
                          ? "bg-red-200"
                          : ""
                      }`}
                    >
                      {getStatus(student.$id, date)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>

          </table>

        </div>
      )}

    </div>
  );
}