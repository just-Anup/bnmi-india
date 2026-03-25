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
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [examFee, setExamFee] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [addedCourses, setAddedCourses] = useState([]);

  const LIMIT = 20;

  useEffect(() => {
    fetchCourses();
    fetchPlan();
    fetchAddedCourses();
  }, []);

  // ✅ FETCH MASTER COURSES (PAGINATION)
  const fetchCourses = async (pageNumber = 0) => {

    const res = await databases.listDocuments(
      DATABASE_ID,
      "courses_master_multiple",
      [
        Query.limit(LIMIT),
        Query.offset(pageNumber * LIMIT),
      ]
    );

    // 🔥 Natural sorting
    const sorted = res.documents.sort((a, b) => {
      const numA = parseInt(a.courseCode.replace(/\D/g, "")) || 0;
      const numB = parseInt(b.courseCode.replace(/\D/g, "")) || 0;
      return numA - numB;
    });

    setCourses(sorted);
    setFilteredCourses(sorted);
  };

  // ✅ FETCH USER PLAN
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

  // ✅ FETCH ALREADY ADDED COURSES
  const fetchAddedCourses = async () => {
    const user = await account.get();

    const res = await databases.listDocuments(
      DATABASE_ID,
      "courses_multiple",
      [Query.equal("franchiseEmail", user.email)]
    );

    const ids = res.documents.map(c => c.courseId);
    setAddedCourses(ids);
  };

  // ✅ SEARCH
  useEffect(() => {
    const filtered = courses.filter(course =>
      course.courseName.toLowerCase().includes(search.toLowerCase()) ||
      course.courseCode.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredCourses(filtered);
  }, [search, courses]);

  // ✅ PAGINATION HANDLERS
  const nextPage = () => {
    const newPage = page + 1;
    setPage(newPage);
    fetchCourses(newPage);
  };

  const prevPage = () => {
    if (page === 0) return;
    const newPage = page - 1;
    setPage(newPage);
    fetchCourses(newPage);
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

      {/* 🔍 SEARCH BAR */}
      <input
        type="text"
        placeholder="Search by course name or code..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6 w-full p-3 bg-[#121212] border border-gray-700 rounded-lg"
      />

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

            {filteredCourses.map(course => {

              const isAdded = addedCourses.includes(course.$id);

              return (
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

                    {isAdded ? (
                      <span className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm">
                        Already Added
                      </span>
                    ) : (
                      <Link
                        href={`/login/institute/add-course/multiple/subjects/${course.$id}?name=${course.courseName}&code=${course.courseCode}`}
                        className="bg-orange-500 hover:bg-orange-600 transition px-4 py-2 rounded-lg text-black font-semibold shadow"
                      >
                        Add Subjects
                      </Link>
                    )}

                  </td>

                </tr>
              );
            })}

          </tbody>

        </table>

      </div>

      {/* 🔁 PAGINATION */}
      <div className="flex justify-between mt-6">

        <button
          onClick={prevPage}
          disabled={page === 0}
          className="bg-gray-700 px-4 py-2 rounded disabled:opacity-50"
        >
          Previous
        </button>

        <span className="text-gray-400">
          Page {page + 1}
        </span>

        <button
          onClick={nextPage}
          className="bg-orange-500 px-4 py-2 rounded text-black"
        >
          Next
        </button>

      </div>

    </div>
  );
}