"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { Query, ID } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const RESULT_COLLECTION = "exam_results";
const CERT_COLLECTION = "certificates";
const BUCKET_ID = "6986e8a4001925504f6b";

export default function CertificatePage() {

  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {

    try {

      setLoading(true);

      const user = await account.get();

      // ✅ LOAD RESULTS
      const res = await databases.listDocuments(
        DATABASE_ID,
        RESULT_COLLECTION,
        [Query.orderDesc("$createdAt")]
      );

      // ✅ LOAD CERTIFICATES
      const certRes = await databases.listDocuments(
        DATABASE_ID,
        CERT_COLLECTION
      );

      // ✅ CREATE APPLIED ARRAY
      const appliedStudents = certRes.documents.map(
        cert => cert.studentId
      );

      // ✅ FILTER RESULTS
      const passedStudents = res.documents
        .filter(
          r =>
            r.grade !== "F" &&
            r.createdById === user.$id
        )
        .map(r => ({
          ...r,
          alreadyApplied: appliedStudents.includes(r.studentId)
        }));

      setResults(passedStudents);

    } catch (err) {

      console.log(err);

    } finally {

      setLoading(false);

    }

  };

 const toggleSelect = (id) => {

  const student = results.find(r => r.$id === id);

  if (student?.alreadyApplied) return;

  if (selected.includes(id)) {
    setSelected(selected.filter(s => s !== id));
  } else {
    setSelected([...selected, id]);
  }
};
  const applyCertificate = async () => {

    if (selected.length === 0) {
      alert("Please select at least one student");
      return;
    }

    try {

      for (const id of selected) {

        const student = results.find(r => r.$id === id);

        if (!student) continue;

        // ✅ PREVENT DUPLICATE
        const existing = await databases.listDocuments(
          DATABASE_ID,
          CERT_COLLECTION,
          [
            Query.equal("studentId", student.studentId)
          ]
        );

        if (existing.documents.length > 0) {
          continue;
        }

        await databases.createDocument(
          DATABASE_ID,
          CERT_COLLECTION,
          ID.unique(),
          {
            studentId: student.studentId,
            studentName: student.studentName,
            course: student.course,
            instituteName: student.instituteName,
            franchiseId: student.franchiseId,
            photoId: student.photoId,
            marks: student.totalMarks,
            grade: student.grade,
            examMode: student.examMode || "OFFLINE",
            examDate: student.examDate || "",
            certificateNo: "BNMI-" + Date.now(),
            status: "pending",
            createdById: student.createdById,
            createdAt: new Date().toISOString()
          }
        );

      }

      alert("Certificate request sent to admin");

      setSelected([]);

      setResults(prev =>
  prev.map(item =>
    selected.includes(item.$id)
      ? { ...item, alreadyApplied: true }
      : item
  )
);

setSelected([]);


      // ✅ RELOAD FOR DISABLE CHECKBOX
      loadResults();

    } catch (err) {

      console.log(err);
      alert("Error applying certificate");

    }

  };

  const getPhoto = (photoId) => {

    if (!photoId) return null;

    return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;

  };

  return (

    <div className="p-8 md:p-10 bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">

        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            All Exam Results
          </h1>

          <p className="text-gray-500 mt-1">
            Apply certificates for passed students
          </p>
        </div>

        <button
          onClick={applyCertificate}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-105 transition-all duration-300 text-white px-6 py-3 rounded-xl shadow-lg font-semibold"
        >
          Apply For Certificate
        </button>

      </div>

      {/* TABLE CARD */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gradient-to-r from-yellow-400 to-yellow-300 text-gray-800">

              <tr>
                <th className="p-4 text-left"></th>
                <th className="p-4 text-left">#</th>
                <th className="p-4 text-left">Photo</th>
                <th className="p-4 text-left">Student</th>
                <th className="p-4 text-left">Course</th>
                <th className="p-4 text-left">Exam Mode</th>
                <th className="p-4 text-left">Objective</th>
                <th className="p-4 text-left">Practical</th>
                <th className="p-4 text-left">Percentage</th>
                <th className="p-4 text-left">Grade</th>
                <th className="p-4 text-left">Result</th>
                <th className="p-4 text-left">Exam Date</th>
              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan="12"
                    className="text-center p-10 text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>

              ) : results.length === 0 ? (

                <tr>
                  <td
                    colSpan="12"
                    className="text-center p-10 text-gray-500"
                  >
                    No Passed Students Found
                  </td>
                </tr>

              ) : (

                results.map((r, index) => {

                  const photoUrl = getPhoto(r.photoId);

                  let objective = 0;
                  let practical = 0;

                  try {

                    const marks = JSON.parse(r.marks);

                    marks.forEach(m => {
                      objective += Number(m.theory || 0);
                      practical += Number(m.practical || 0);
                    });

                  } catch { }

                  return (

                    <tr
                      key={r.$id}
                      className="border-b hover:bg-blue-50 transition-all duration-200"
                    >

                      {/* CHECKBOX */}
                      <td className="p-4">

                        {r.alreadyApplied ? (

                          <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-semibold">
                            Applied
                          </span>

                        ) : (

                        <input
  type="checkbox"
  checked={selected.includes(r.$id)}
  disabled={r.alreadyApplied}
  onChange={() => toggleSelect(r.$id)}
  className={`w-5 h-5 accent-blue-600 ${
    r.alreadyApplied
      ? "cursor-not-allowed opacity-50"
      : "cursor-pointer"
  }`}
/>

                        )}

                      </td>

                      <td className="p-4 font-medium">
                        {index + 1}
                      </td>

                      {/* PHOTO */}
                      <td className="p-4">

                        {photoUrl && (
                          <img
                            src={photoUrl}
                            className="w-14 h-14 rounded-full object-cover border-2 border-blue-200 shadow"
                          />
                        )}

                      </td>

                      {/* NAME */}
                      <td className="p-4 font-semibold text-gray-700">
                        {r.studentName}
                      </td>

                      {/* COURSE */}
                      <td className="p-4 text-gray-600">
                        {r.course}
                      </td>

                      {/* EXAM MODE */}
                      <td className="p-4">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                          OFFLINE
                        </span>
                      </td>

                      {/* OBJECTIVE */}
                      <td className="p-4 font-medium">
                        {objective}
                      </td>

                      {/* PRACTICAL */}
                      <td className="p-4 font-medium">
                        {practical}
                      </td>

                      {/* PERCENTAGE */}
                      <td className="p-4 font-bold text-blue-700">
                        {r.percentage}%
                      </td>

                      {/* GRADE */}
                      <td className="p-4">

                        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-semibold text-sm">
                          {r.grade}
                        </span>

                      </td>

                      {/* RESULT */}
                      <td className="p-4">

                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                          Passed
                        </span>

                      </td>

                      {/* DATE */}
                      <td className="p-4 text-gray-600">
                        {r.examDate || "-"}
                      </td>

                    </tr>

                  );

                })

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );

}