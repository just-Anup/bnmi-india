"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { Query, ID } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const STUDENT_COLLECTION = "student_admissions";
const ATTENDANCE_COLLECTION = "attendance"; // create this in Appwrite

export default function AttendancePage() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // 🔥 LOAD BATCHES (from admissions)
  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      const user = await account.get();

      const res = await databases.listDocuments(
        DATABASE_ID,
        STUDENT_COLLECTION,
        [Query.equal("franchiseEmail", user.email)]
      );

      // Extract unique batches
      const uniqueBatches = [
        ...new Set(res.documents.map((doc) => doc.batch).filter(Boolean)),
      ];

      setBatches(uniqueBatches);
    } catch (err) {
      console.log(err);
    }
  };

  // 🔥 LOAD STUDENTS BY BATCH
  const loadStudents = async () => {
    if (!selectedBatch) {
      alert("Please select batch");
      return;
    }

    try {
      const user = await account.get();

      const res = await databases.listDocuments(
        DATABASE_ID,
        STUDENT_COLLECTION,
        [
          Query.equal("franchiseEmail", user.email),
          Query.equal("batch", selectedBatch),
        ]
      );

      setStudents(res.documents);

      // Initialize attendance (default present)
      const initialAttendance = {};
      res.documents.forEach((student) => {
        initialAttendance[student.$id] = "Present";
      });

      setAttendance(initialAttendance);
    } catch (err) {
      console.log(err);
    }
  };

 
  // 🔥 HANDLE ATTENDANCE CHANGE
  const handleAttendanceChange = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // 🔥 SAVE ATTENDANCE
const saveAttendance = async () => {
  try {
    const user = await account.get();

    if (students.length === 0) {
      alert("No students found");
      return;
    }

    for (const student of students) {
        const existing = await databases.listDocuments(
  DATABASE_ID,
  ATTENDANCE_COLLECTION,
  [
    Query.equal("studentId", student.$id),
    Query.equal("date", date),
  ]
);

if (existing.documents.length > 0) {
  continue; // skip duplicate
}
      await databases.createDocument(
        DATABASE_ID,
        ATTENDANCE_COLLECTION,
        ID.unique(),
        {
          studentId: student.$id,
          studentName: student.studentName || "",
          batch: selectedBatch || "",
          status: attendance[student.$id] || "Present",
          date: date || new Date().toISOString(),
          franchiseEmail: user.email || "",
        }
      );
    }

    alert("Attendance Saved Successfully ✅");

  } catch (err) {
    console.error("ERROR SAVING:", err);
    alert(err.message || "Failed to save attendance");
  }
};
  return (
    <div className="p-8 bg-gray-100 rounded">

      <h1 className="text-2xl font-bold mb-6">
        ATTENDANCE SECTION
      </h1>

      {/* TOP SECTION */}
      <div className="bg-white p-6 rounded shadow mb-6 grid grid-cols-4 gap-4">

        {/* Batch Select */}
        <div>
          <label className="block mb-1 font-semibold">Select Batch</label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="border p-2 w-full"
          >
            <option value="">--select--</option>
            {batches.map((batch, index) => (
              <option key={index} value={batch}>
                {batch}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block mb-1 font-semibold">Select Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border p-2 w-full"
          />
        </div>

        {/* Load Button */}
        <div className="flex items-end">
          <button
            onClick={loadStudents}
            className="bg-red-500 text-white px-6 py-2 rounded"
          >
            Load
          </button>
        </div>

        {/* Refresh */}
        <div className="flex items-end">
          <button
            onClick={loadBatches}
            className="bg-yellow-400 px-6 py-2 rounded"
          >
            Refresh
          </button>
        </div>

      </div>

      {/* BATCH INFO */}
      {selectedBatch && (
        <div className="mb-4 p-4 bg-blue-100 rounded">
          <p><strong>Batch:</strong> {selectedBatch}</p>
          <p><strong>Total Students:</strong> {students.length}</p>
        </div>
      )}

      {/* STUDENT LIST */}
      {students.length > 0 && (
        <div className="bg-white p-6 rounded shadow">

          <table className="w-full border">

            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 border">#</th>
                <th className="p-2 border">Student Name</th>
                <th className="p-2 border">Status</th>
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
                    <select
                      value={attendance[student.$id]}
                      onChange={(e) =>
                        handleAttendanceChange(
                          student.$id,
                          e.target.value
                        )
                      }
                      className="border p-1"
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>

          <button
            onClick={saveAttendance}
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded"
          >
            Save Attendance
          </button>

        </div>
      )}

    </div>
  );
}