"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { Query } from "appwrite";
import Link from "next/link";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION = "semester_courses";

export default function SemesterCourseList() {

  const [courses, setCourses] = useState([]);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {

    const user = await account.get();

    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION,
      [
        Query.equal("createdById", user.$id),
        Query.orderDesc("$createdAt")
      ]
    );

    setCourses(res.documents);
  };

  return (

    <div className="p-10 bg-black min-h-screen text-white">

      <div className="flex justify-between mb-6">

        <h1 className="text-2xl font-bold">
          SEMESTER COURSES
        </h1>

        <Link
          href="/login/institute/add-course/semester-course/add"
          className="bg-orange-500 hover:bg-orange-600 text-black px-6 py-2 rounded font-semibold"
        >
          Add Course
        </Link>

      </div>

      <table className="w-full border border-gray-800 bg-[#121212]">

        <thead className="bg-orange-500 text-black">

          <tr>
            <th className="p-3 border border-gray-800">#</th>
            <th className="p-3 border border-gray-800">Course Code</th>
            <th className="p-3 border border-gray-800">Course Name</th>
            <th className="p-3 border border-gray-800">Duration</th>
            <th className="p-3 border border-gray-800">Semesters</th>
          </tr>

        </thead>

        <tbody>

          {courses.map((c, i) => (

            <tr key={c.$id} className="border-t border-gray-800 hover:bg-[#1a1a1a]">

              <td className="p-3 border border-gray-800">{i + 1}</td>
              <td className="p-3 border border-gray-800">{c.courseCode}</td>
              <td className="p-3 border border-gray-800">{c.courseName}</td>
              <td className="p-3 border border-gray-800">{c.duration}</td>
              <td className="p-3 border border-gray-800">{c.totalSemesters}</td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}