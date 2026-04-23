"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { Query } from "appwrite";
import Link from "next/link";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function SemesterCourseList() {

  const [courses, setCourses] = useState([]);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    const user = await account.get();

    const res = await databases.listDocuments(
      DATABASE_ID,
      "semester_courses",
      [
        Query.equal("createdById", user.$id),
        Query.orderDesc("$createdAt")
      ]
    );

    setCourses(res.documents);
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white p-10">

      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 text-transparent bg-clip-text">
            Semester Courses
          </h1>

          <Link href="/login/institute/add-course/semester-course/add" className="btn-glow">
            + Add Course
          </Link>
        </div>

        <div className="cool-card">

          <table className="w-full text-sm">
<thead className="text-gray-400 border-b border-gray-700">
  <tr>
    <th className="p-4 text-left">#</th>
    <th className="p-4 text-left">Code</th>
    <th className="p-4 text-left">Name</th>
    <th className="p-4 text-left">Duration</th>
    <th className="p-4 text-left">Sem</th>
        <th className="p-4 text-left">Exam Fees</th> 
        <th className="p-4 text-left">Course Fees</th>
        <th className="p-4 text-left">Action</th>
  </tr>
</thead>

<tbody>
  {courses.map((c, i) => (
    <tr key={c.$id} className="row">
      <td className="p-4">{i + 1}</td>
      <td className="p-4 text-orange-400 font-semibold">{c.courseCode}</td>
      <td className="p-4">{c.courseName}</td>
      <td className="p-4">{c.duration}</td>
      <td className="p-4">{c.totalSemesters}</td>
      <td className="p-4 text-green-400 font-semibold">
  ₹{c.examFees}
</td>
<td className="p-4 text-blue-400 font-semibold">
  ₹{c.courseFees || 0}
</td>
<td className="p-4">
  <Link
    href={`/login/institute/add-course/semester-course/${c.courseCode}`}
    className="bg-orange-500 px-3 py-1 rounded text-black"
  >
    Add Semester
  </Link>
</td>
    </tr>
  ))}
</tbody>

          </table>

        </div>

      </div>

      <style jsx>{`
        .cool-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          backdrop-filter: blur(10px);
        }
.row {
  border-bottom: 1px solid rgba(255,255,255,0.06);
  transition: 0.25s;
}

.row:hover {
  background: rgba(255,255,255,0.05);
}

/* 🔥 Fix alignment */
th, td {
  vertical-align: middle;
  white-space: nowrap;
}

/* Optional: better spacing for name column */
td:nth-child(3) {
  width: 40%;
}
        .hover-row {
          transition: 0.3s;
        }

        .hover-row:hover {
          background: rgba(255,255,255,0.08);
          transform: scale(1.01);
        }

        .btn-glow {
          background: linear-gradient(135deg,#f97316,#fb923c);
          padding: 10px 18px;
          border-radius: 10px;
          box-shadow: 0 0 15px rgba(249,115,22,0.6);
        }

        .btn-glow:hover {
          box-shadow: 0 0 25px rgba(249,115,22,0.9);
        }
      `}</style>

    </div>
  );
}