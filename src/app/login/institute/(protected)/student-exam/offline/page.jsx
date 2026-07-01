"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useRouter } from "next/navigation";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const ADMISSION_COLLECTION = "student_admissions";
const RESULT_COLLECTION = "exam_results";
const BUCKET_ID = "6986e8a4001925504f6b";

export default function OfflineExamList() {

  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [results, setResults] = useState({});

  // ✅ EXAM MODE
  const [examMode, setExamMode] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {

    const user = await account.get();

    const admissions = await databases.listDocuments(
      DATABASE_ID,
      ADMISSION_COLLECTION,
      [Query.equal("createdById", user.$id),
        Query.limit(200)
      ]

    );

    const examResults = await databases.listDocuments(
      DATABASE_ID,
      RESULT_COLLECTION,
      [Query.equal("createdById", user.$id),
         Query.limit(200)
      ]
    );

    const resultMap = {};

    examResults.documents.forEach((r) => {
      resultMap[r.studentId] = r;
    });

    setStudents(admissions.documents);
    setResults(resultMap);

    // ✅ LOAD SAVED EXAM MODE
    const savedMode = {};

    admissions.documents.forEach((student) => {
      savedMode[student.$id] = student.examMode || "";
    });

    setExamMode(savedMode);
  };

  return (

    <div className="p-10 bg-black min-h-screen text-white">

      <h2 className="text-2xl font-bold mb-6">
        List Offline Exams Results
      </h2>

      <table className="w-full border border-gray-800 bg-[#121212] overflow-hidden rounded-xl">

        <thead className="bg-orange-500 text-black">

          <tr>
            <th className="p-3 border border-gray-800">#</th>
            <th className="p-3 border border-gray-800">Photo</th>
            <th className="p-3 border border-gray-800">Student</th>
            <th className="p-3 border border-gray-800">Course</th>
            <th className="p-3 border border-gray-800">Exam Mode</th>
            <th className="p-3 border border-gray-800">Exam Status</th>
            <th className="p-3 border border-gray-800">Action</th>
          </tr>

        </thead>

        <tbody>

          {students.map((student, index) => {

            const result = results[student.$id];

            const photoUrl = student.photoId
              ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
              : null;

            return (

              <tr
                key={student.$id}
                className="border-t border-gray-800 hover:bg-[#1a1a1a] transition-all duration-300"
              >

                <td className="border border-gray-800 p-3">
                  {index + 1}
                </td>

                <td className="border border-gray-800 p-3">

                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      className="w-16 h-16 rounded-full object-cover border-2 border-orange-500 shadow-lg"
                    />
                  ) : (
                    "No Photo"
                  )}

                </td>

                <td className="border border-gray-800 p-3 font-medium">
                  {student.studentName}
                </td>

                <td className="border border-gray-800 p-3">
                  {student.courseType === "semester" && student.courseName?.length > 20
                    ? "Semester Course"
                    : student.courseName}
                </td>

                {/* ✅ EXAM MODE */}
                <td className="border border-gray-800 p-3">

                  <select
                    value={examMode[student.$id] || ""}
                    onChange={async (e) => {

                      const value = e.target.value;

                      const updated = {
                        ...examMode,
                        [student.$id]: value
                      };

                      setExamMode(updated);

                      try {

                        await databases.updateDocument(
                          DATABASE_ID,
                          ADMISSION_COLLECTION,
                          student.$id,
                          {
                            examMode: value
                          }
                        );

                      } catch (err) {
                        console.log(err);
                      }
                    }}
                    className="bg-black border border-gray-700 text-white px-4 py-2 rounded-lg outline-none focus:border-orange-500"
                  >

                    <option value="">
                      Select
                    </option>

                    <option value="offline">
                      Offline
                    </option>

                    <option value="online">
                      Online
                    </option>

                  </select>

                </td>

                {/* ✅ RESULT STATUS */}
                <td className="border border-gray-800 p-3">

                  {result ? (

                    <div>

                      <p className="font-semibold text-green-400">
                        Appeared
                      </p>

                      <table className="border border-gray-700 mt-2 text-sm">

                        <thead>
                          <tr>

                            <th className="border border-gray-700 px-2">
                              Marks
                            </th>

                            <th className="border border-gray-700 px-2">
                              Result
                            </th>

                            <th className="border border-gray-700 px-2">
                              Grade
                            </th>

                          </tr>
                        </thead>

                        <tbody>
                          <tr>

                            <td className="border border-gray-700 px-2">
                              {result.percentage}%
                            </td>

                            <td className="border border-gray-700 px-2">
                              {result.percentage >= 40 ? "Passed" : "Failed"}
                            </td>

                            <td className="border border-gray-700 px-2">
                              {result.grade}
                            </td>

                          </tr>
                        </tbody>

                      </table>

                    </div>

                  ) : (

                    <span className="text-yellow-400 font-medium">
                      Applied
                    </span>

                  )}

                </td>

                {/* ✅ ACTION BUTTON */}
                <td className="border border-gray-800 p-3">

                  {/* OFFLINE BUTTON */}
                  {examMode[student.$id] === "offline" && (

                    <button
                      onClick={() =>
                        router.push(`/login/institute/student-exam/offline/${student.$id}`)
                      }
                      className="bg-orange-500 hover:bg-orange-600 text-black font-semibold px-5 py-2 rounded-lg transition-all duration-300 shadow-lg"
                    >

                      {result ? "Update Result" : "Add Result"}

                    </button>

                  )}

                  {/* ONLINE BUTTON */}
                  {examMode[student.$id] === "online" && (

                    <button
                      onClick={async () => {

                        try {

                          await databases.updateDocument(
                            DATABASE_ID,
                            ADMISSION_COLLECTION,
                            student.$id,
                            {
                              onlineExamStarted: true
                            }
                          );

                          alert("Online Exam Started Successfully");

                        } catch (err) {
                          console.log(err);
                          alert("Failed To Start Exam");
                        }

                      }}
                      className="bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-2 rounded-lg transition-all duration-300 shadow-lg"
                    >

                      Start Exam

                    </button>

                  )}

                  {/* NO SELECTION */}
                  {!examMode[student.$id] && (

                    <button
                      disabled
                      className="bg-gray-700 text-gray-400 cursor-not-allowed font-semibold px-5 py-2 rounded-lg"
                    >

                      Select Mode

                    </button>

                  )}

                </td>

              </tr>

            );

          })}

        </tbody>

      </table>

    </div>

  );
}