"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { Query } from "appwrite";
import Link from "next/link";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

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

  // FETCH MASTER COURSES
// FETCH MASTER COURSES
const fetchCourses = async () => {

  let allCourses = [];
  let offset = 0;
  const LIMIT = 100;

  while (true) {

    const res = await databases.listDocuments(
      DATABASE_ID,
      "courses_master_multiple",
      [
        Query.limit(LIMIT),
        Query.offset(offset),
      ]
    );

    if (res.documents.length === 0) break;

    allCourses = [...allCourses, ...res.documents];

    offset += LIMIT;
  }

  // NATURAL SORTING
  const sorted = allCourses.sort((a, b) => {

    const numA = parseInt(a.courseCode.replace(/\D/g, "")) || 0;
    const numB = parseInt(b.courseCode.replace(/\D/g, "")) || 0;

    return numA - numB;
  });

  setCourses(sorted);
  setFilteredCourses(sorted);
};
  // FETCH USER PLAN
  const fetchPlan = async () => {

    const user = await account.get();

    const res = await databases.listDocuments(
      DATABASE_ID,
      "franchise_approved",
      [Query.equal("email", user.email)]
    );

    const plan = res.documents[0]?.plan;

    const planRes = await databases.listDocuments(
      DATABASE_ID,
      "franchise_plans",
      [Query.equal("name", plan)]
    );

    const fee = planRes.documents[0]?.amount || 0;

    setExamFee(fee);
  };

  // FETCH ADDED COURSES
  const fetchAddedCourses = async () => {

    const user = await account.get();

    const res = await databases.listDocuments(
      DATABASE_ID,
      "franchise_multiple_courses",
      [Query.equal("franchiseEmail", user.email)]
    );

    const ids = res.documents.map(c => c.courseId);

    setAddedCourses(ids);
  };

  // SEARCH
  useEffect(() => {

    const filtered = courses.filter(course =>
      course.courseName.toLowerCase().includes(search.toLowerCase()) ||
      course.courseCode.toLowerCase().includes(search.toLowerCase())
    );

    setFilteredCourses(filtered);

  }, [search, courses]);

  
  return (

    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white p-3 sm:p-5 lg:p-10">

      {/* HEADER */}
      <div className="mb-6 sm:mb-8">

        <h1 className="text-2xl sm:text-3xl font-bold tracking-wide leading-tight">
          Multiple Course Selection
        </h1>

        <p className="text-gray-400 mt-2 text-sm sm:text-base">
          Select a course and assign subjects easily
        </p>

      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search by course name or code..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6 w-full p-3 bg-[#121212] border border-gray-700 rounded-lg outline-none focus:border-orange-500 text-sm sm:text-base"
      />

      {/* TABLE CARD */}
      <div className="bg-[#121212] border border-gray-800 rounded-2xl shadow-xl overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[800px]">

            <thead className="bg-orange-500 text-black text-xs sm:text-sm uppercase tracking-wide">

              <tr>

                <th className="p-3 sm:p-4 text-left whitespace-nowrap">
                  Code
                </th>

                <th className="p-3 sm:p-4 text-left whitespace-nowrap">
                  Course Name
                </th>

                <th className="p-3 sm:p-4 text-left whitespace-nowrap">
                  Duration
                </th>

                <th className="p-3 sm:p-4 text-left whitespace-nowrap">
                  Exam Fee
                </th>

                <th className="p-3 sm:p-4 text-left whitespace-nowrap">
                  Action
                </th>

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

                    <td className="p-3 sm:p-4 font-mono text-gray-300 whitespace-nowrap">
                      {course.courseCode}
                    </td>

                    <td className="p-3 sm:p-4 font-semibold text-white min-w-[220px]">
                      {course.courseName}
                    </td>

                    <td className="p-3 sm:p-4 text-gray-400 whitespace-nowrap">
                      {course.duration}
                    </td>

                    <td className="p-3 sm:p-4 text-green-400 font-semibold whitespace-nowrap">
                      ₹{examFee}
                    </td>

                    <td className="p-3 sm:p-4">

                      {isAdded ? (

                        <span className="bg-gray-700 text-gray-300 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm inline-block whitespace-nowrap">
                          Already Added
                        </span>
                      ) : (

                        <Link
                       href={`/login/institute/add-course/multiple/subjects/${course.$id}?name=${course.courseName}&code=${course.courseCode}&duration=${course.duration}&examFee=${examFee}`}
                          className="bg-orange-500 hover:bg-orange-600 transition px-3 sm:px-4 py-2 rounded-lg text-black font-semibold shadow text-xs sm:text-sm inline-block whitespace-nowrap"
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

      </div>

   

    </div>
  );
}