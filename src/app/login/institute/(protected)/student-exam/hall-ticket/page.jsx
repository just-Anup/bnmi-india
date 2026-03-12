"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION = "student_admissions";
const BUCKET_ID = "6986e8a4001925504f6b";

export default function HallTicketPage() {

  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState([]);

  const [examDate, setExamDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reportingTime, setReportingTime] = useState("");

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {

    try {

      const user = await account.get();

      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION,
        [
          Query.equal("createdById", user.$id),
          Query.orderDesc("$createdAt")
        ]
      );

      setStudents(res.documents);

    } catch (error) {

      console.log("Error loading students:", error);

    }

  };

  const toggleStudent = (id) => {

    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id));
    } else {
      setSelected([...selected, id]);
    }

  };

  const generateHallTicket = () => {

    const selectedStudents = students.filter(s => selected.includes(s.$id));

    localStorage.setItem("hallticketStudents", JSON.stringify(selectedStudents));

    localStorage.setItem("hallticketExam", JSON.stringify({
      examDate,
      startTime,
      endTime,
      reportingTime
    }));

    window.open("/login/institute/student-exam/hall-ticket/print", "_blank");

  };

  return (

    <div className="p-10 bg-black min-h-screen text-white">

      <h1 className="text-2xl font-bold mb-6">
        LIST STUDENTS HALLTICKET
      </h1>

      <div className="bg-[#121212] border border-gray-800 p-6 rounded shadow mb-6">

        <div className="grid grid-cols-4 gap-4">

          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="border border-gray-700 bg-black text-white p-2 rounded"
          />

          <input
            placeholder="Start Time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="border border-gray-700 bg-black text-white p-2 rounded"
          />

          <input
            placeholder="End Time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="border border-gray-700 bg-black text-white p-2 rounded"
          />

          <input
            placeholder="Reporting Time"
            value={reportingTime}
            onChange={(e) => setReportingTime(e.target.value)}
            className="border border-gray-700 bg-black text-white p-2 rounded"
          />

        </div>

        <button
          onClick={generateHallTicket}
          className="mt-4 bg-orange-500 hover:bg-orange-600 text-black font-semibold px-6 py-2 rounded"
        >
          Generate Hallticket
        </button>

      </div>

      <table className="w-full border border-gray-800">

        <thead>

          <tr className="bg-orange-500 text-black">

            <th className="p-2 border border-gray-800"></th>
            <th className="p-2 border border-gray-800">Photo</th>
            <th className="p-2 border border-gray-800">Student Name</th>
            <th className="p-2 border border-gray-800">Course</th>
            <th className="p-2 border border-gray-800">Fees</th>
            <th className="p-2 border border-gray-800">Exam Mode</th>
            <th className="p-2 border border-gray-800">Balance</th>

          </tr>

        </thead>

        <tbody>

          {students.map((s) => {

            const photo = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${s.photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;

            return (

              <tr key={s.$id} className="border-t border-gray-800 hover:bg-[#1a1a1a]">

                <td className="p-2 border border-gray-800">
                  <input
                    type="checkbox"
                    onChange={() => toggleStudent(s.$id)}
                    className="accent-orange-500"
                  />
                </td>

                <td className="p-2 border border-gray-800">
                  <img src={photo} className="w-12 h-12 rounded-full" />
                </td>

                <td className="p-2 border border-gray-800">{s.studentName}</td>
                <td className="p-2 border border-gray-800">{s.courseName}</td>
                <td className="p-2 border border-gray-800">{s.courseFees}</td>
                <td className="p-2 border border-gray-800">{s.examMode}</td>
                <td className="p-2 border border-gray-800">{s.balance}</td>

              </tr>

            );

          })}

        </tbody>

      </table>

    </div>

  );

}