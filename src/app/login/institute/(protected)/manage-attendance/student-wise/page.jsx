"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const STUDENT_COLLECTION = "student_admissions";
const ATTENDANCE_COLLECTION = "attendance";

export default function StudentAttendanceReport() {

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");

  const [attendance, setAttendance] = useState([]);

  // 🔥 LOAD STUDENTS
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const user = await account.get();

    const res = await databases.listDocuments(
      DATABASE_ID,
      STUDENT_COLLECTION,
      [Query.equal("franchiseEmail", user.email)]
    );

    setStudents(res.documents);
  };

  // 🔥 FILTER REPORT
  const loadReport = async () => {

    if (!selectedStudent) {
      alert("Please select student");
      return;
    }

    if (!selectedCourse) {
      alert("Please select course");
      return;
    }

    try {
      const user = await account.get();

      const res = await databases.listDocuments(
        DATABASE_ID,
        ATTENDANCE_COLLECTION,
        [
          Query.equal("studentId", selectedStudent),
          Query.equal("franchiseEmail", user.email),
        ]
      );

      setAttendance(res.documents);

    } catch (err) {
      console.log(err);
    }
  };

  const selectedStudentData = students.find(
    (s) => s.$id === selectedStudent
  );

  return (
    <div className="p-8 bg-gray-100 rounded">

      <h1 className="text-2xl font-bold mb-6">
        ATTENDANCE REPORT
      </h1>

      {/* FILTER SECTION */}
      <div className="bg-white p-6 rounded shadow mb-6 grid grid-cols-3 gap-4">

        {/* Student */}
        <div>
          <label className="font-semibold">Student Name</label>
          <select
            value={selectedStudent}
            onChange={(e) => {
              setSelectedStudent(e.target.value);

              // auto fill course
              const student = students.find(s => s.$id === e.target.value);
              if (student) setSelectedCourse(student.courseName);
            }}
            className="border p-2 w-full"
          >
            <option value="">--select--</option>
            {students.map((s) => (
              <option key={s.$id} value={s.$id}>
                {s.studentName}
              </option>
            ))}
          </select>
        </div>

        {/* Course */}
        <div>
          <label className="font-semibold">Select Course</label>
          <input
            value={selectedCourse}
            readOnly
            className="border p-2 w-full bg-gray-100"
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

      {/* RESULT */}
      {attendance.length > 0 && (
        <div className="bg-white p-6 rounded shadow">

          <div className="mb-4">
            <p><strong>Student:</strong> {selectedStudentData?.studentName}</p>
            <p><strong>Course:</strong> {selectedCourse}</p>
          </div>

          <table className="w-full border">

            <thead>
              <tr className="bg-green-500 text-white">
                <th className="p-2 border">S/N</th>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Status</th>
              </tr>
            </thead>

            <tbody>
              {attendance.map((a, index) => (
                <tr key={a.$id}>
                  <td className="p-2 border">{index + 1}</td>

                  <td className="p-2 border">
                    {a.date}
                  </td>

                  <td
                    className={`p-2 border text-center ${
                      a.status === "Present"
                        ? "bg-green-200"
                        : "bg-red-200"
                    }`}
                  >
                    {a.status}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>

        </div>
      )}

    </div>
  );
}