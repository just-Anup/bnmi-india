"use client";

import { useEffect, useState } from "react";

export default function SemesterMarksheet() {

  const [data, setData] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("marksheetStudent");
    if (stored) {
      setData(JSON.parse(stored));
    }
  }, []);

  if (!data) return <p>Loading...</p>;

  const total = data.marksArray.reduce((sum, m) => sum + m.total, 0);

  return (
    <div className="p-10 bg-white min-h-screen">

      <h1 className="text-2xl font-bold text-center mb-6">
        SEMESTER MARKSHEET
      </h1>

      <div className="mb-6">
        <p><b>Name:</b> {data.studentName}</p>
        <p><b>Course:</b> {data.course}</p>
        <p><b>Semester:</b> {data.semesterNumber}</p>
        <p><b>Institute:</b> {data.instituteName}</p>
      </div>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Subject</th>
            <th className="border p-2">Objective</th>
            <th className="border p-2">Practical</th>
            <th className="border p-2">Total</th>
          </tr>
        </thead>

        <tbody>
          {data.marksArray.map((m, i) => (
            <tr key={i}>
              <td className="border p-2">{m.subject}</td>
              <td className="border p-2">{m.objective}</td>
              <td className="border p-2">{m.practical}</td>
              <td className="border p-2 font-bold">{m.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 text-lg">
        <p><b>Total Marks:</b> {total}</p>
        <p><b>Grade:</b> {data.grade}</p>
      </div>

    </div>
  );
}