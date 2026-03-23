"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { Query } from "appwrite";
import Link from "next/link";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

const institutePlans = {
  HOJAI: 400,
  BIHAR: 499,
  "ARUNACHAL PRADESH": 499,
  BEAUTY: 500,
};

export default function AddMultipleCourse() {

  const [courses, setCourses] = useState([]);
  const [examFee, setExamFee] = useState(0);

  useEffect(() => {
    fetchCourses();
    fetchPlan();
  }, []);

  const fetchCourses = async () => {
    const res = await databases.listDocuments(
      DATABASE_ID,
      "courses_master_multiple"
    );
    setCourses(res.documents);
  };

  const fetchPlan = async () => {
    const user = await account.get();

    const res = await databases.listDocuments(
      DATABASE_ID,
      "franchise_approved",
      [Query.equal("email", user.email)]
    );

    const plan = res.documents[0]?.plan;
    setExamFee(institutePlans[plan] || 0);
  };

  return (

    <div className="p-10 bg-gradient-to-br from-black to-gray-900 min-h-screen text-white">

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-wide">
          Multiple Course Selection
        </h1>
        <p className="text-gray-400 mt-1">
          Select a course and assign subjects easily
        </p>
      </div>

      {/* CARD */}
      <div className="bg-[#121212] border border-gray-800 rounded-2xl shadow-xl overflow-hidden">

        <table className="w-full">

          <thead className="bg-orange-500 text-black text-sm uppercase tracking-wide">

            <tr>
              <th className="p-4 text-left">Code</th>
              <th className="p-4 text-left">Course Name</th>
              <th className="p-4 text-left">Duration</th>
              <th className="p-4 text-left">Exam Fee</th>
              <th className="p-4 text-left">Action</th>
            </tr>

          </thead>

          <tbody>

            {courses.map(course => (

              <tr
                key={course.$id}
                className="border-t border-gray-800 hover:bg-[#1a1a1a] transition"
              >

                <td className="p-4 font-mono text-gray-300">
                  {course.courseCode}
                </td>

                <td className="p-4 font-semibold text-white">
                  {course.courseName}
                </td>

                <td className="p-4 text-gray-400">
                  {course.duration}
                </td>

                <td className="p-4 text-green-400 font-semibold">
                  ₹{examFee}
                </td>

                <td className="p-4">

                  <Link
                    href={`/login/institute/add-course/multiple/subjects/${course.$id}?name=${course.courseName}&code=${course.courseCode}`}
                    className="bg-orange-500 hover:bg-orange-600 transition px-4 py-2 rounded-lg text-black font-semibold shadow"
                  >
                    Add Subjects
                  </Link>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}