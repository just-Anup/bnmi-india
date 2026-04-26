"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const router = useRouter();
  const [student, setStudent] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem("student");

    if (!data) {
      router.push("/student/login");
    } else {
      setStudent(JSON.parse(data));
    }
  }, []);

  if (!student) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-2xl shadow-lg mb-6">
        <h1 className="text-2xl font-bold">
          Welcome, {student.studentName}
        </h1>
        <p className="text-sm opacity-80">
          Ready to practice and improve your skills 🚀
        </p>
      </div>

      {/* INFO CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

        <div className="bg-white p-5 rounded-2xl shadow hover:shadow-lg transition">
          <p className="text-gray-500 text-sm">Batch</p>
          <h2 className="text-xl font-semibold">{student.batch}</h2>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow hover:shadow-lg transition">
          <p className="text-gray-500 text-sm">Course</p>
          <h2 className="text-lg font-semibold">
            {student.courseName || "N/A"}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow hover:shadow-lg transition">
          <p className="text-gray-500 text-sm">Mobile</p>
          <h2 className="text-lg font-semibold">{student.mobile}</h2>
        </div>

      </div>

      {/* PRACTICE CARD */}
      <div className="bg-white p-6 rounded-2xl shadow flex flex-col md:flex-row items-center justify-between">

        <div>
          <h2 className="text-xl font-semibold mb-2">
            Practice MCQ
          </h2>
          <p className="text-gray-500 text-sm">
            Test your knowledge with real questions
          </p>
        </div>

        <button
          onClick={() => {
            localStorage.setItem("course", student.courseName);
            router.push("/student/quiz");
          }}
          className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl shadow transition"
        >
          Start Practice
        </button>

      </div>

    </div>
  );
}