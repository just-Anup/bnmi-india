"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const RESULT_COLLECTION = "exam_results";
const BUCKET_ID = "6986e8a4001925504f6b";

export default function AllExamResults() {

  const [results, setResults] = useState([]);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {

    try {

      const user = await account.get();

      const res = await databases.listDocuments(
        DATABASE_ID,
        RESULT_COLLECTION,
        [
          Query.equal("createdById", user.$id),
          Query.orderDesc("$createdAt")
        ]
      );

      setResults(res.documents);

    } catch (err) {

      console.log(err);

    }

  };

  const getPhoto = (photoId) => {

    if (!photoId) return null;

    return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;

  };

  const calculateObjective = (marks) => {

    try {

      const parsed = JSON.parse(marks);

      let total = 0;

      parsed.forEach(m => {
        total += Number(m.theory || 0);
      });

      return total;

    } catch {

      return 0;

    }

  };

  const calculatePractical = (marks) => {

    try {

      const parsed = JSON.parse(marks);

      let total = 0;

      parsed.forEach(m => {
        total += Number(m.practical || 0);
      });

      return total;

    } catch {

      return 0;

    }

  };

  return (

    <div className="p-10 bg-black min-h-screen text-white">

      <h1 className="text-2xl font-bold mb-6">
        ALL EXAMS RESULTS
      </h1>

      <div className="bg-[#121212] border border-gray-800 rounded shadow p-6">

        <table className="w-full border border-gray-800">

          <thead className="bg-orange-500 text-black">

            <tr>

              <th className="border border-gray-800 p-3">#</th>
              <th className="border border-gray-800 p-3">Photo</th>
              <th className="border border-gray-800 p-3">Student</th>
              <th className="border border-gray-800 p-3">Course</th>
              <th className="border border-gray-800 p-3">Exam Mode</th>
              <th className="border border-gray-800 p-3">Objective Marks</th>
              <th className="border border-gray-800 p-3">Practical Marks</th>
              <th className="border border-gray-800 p-3">Percentage</th>
              <th className="border border-gray-800 p-3">Grade</th>
              <th className="border border-gray-800 p-3">Result</th>
              <th className="border border-gray-800 p-3">Created On</th>

            </tr>

          </thead>

          <tbody>

            {results.length === 0 ? (

              <tr>
                <td colSpan="11" className="text-center p-6 text-gray-400">
                  No exam results found
                </td>
              </tr>

            ) : (

              results.map((r, index) => {

                const objective = calculateObjective(r.marks);
                const practical = calculatePractical(r.marks);

                const resultStatus = r.grade === "F" ? "Failed" : "Passed";

                const photoUrl = getPhoto(r.photoId);

                return (

                  <tr key={r.$id} className="border-t border-gray-800 hover:bg-[#1a1a1a]">

                    <td className="border border-gray-800 p-3">
                      {index + 1}
                    </td>

                    <td className="border border-gray-800 p-3">

                      {photoUrl && (
                        <img
                          src={photoUrl}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}

                    </td>

                    <td className="border border-gray-800 p-3">
                      {r.studentName}
                    </td>

                    <td className="border border-gray-800 p-3">
                      {r.course}
                    </td>

                    <td className="border border-gray-800 p-3">
                      OFFLINE
                    </td>

                    <td className="border border-gray-800 p-3">
                      {objective}
                    </td>

                    <td className="border border-gray-800 p-3">
                      {practical}
                    </td>

                    <td className="border border-gray-800 p-3">
                      {r.percentage}
                    </td>

                    <td className="border border-gray-800 p-3">
                      {r.grade}
                    </td>

                    <td className={`border border-gray-800 p-3 font-semibold ${
                      resultStatus === "Passed" ? "text-green-400" : "text-red-400"
                    }`}>
                      {resultStatus}
                    </td>

                    <td className="border border-gray-800 p-3">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>

                  </tr>

                );

              })

            )}

          </tbody>

        </table>

      </div>

    </div>

  );

}
