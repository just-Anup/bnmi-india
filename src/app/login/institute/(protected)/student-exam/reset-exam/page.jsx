"use client";

import { useEffect, useState } from "react";
import { databases, account, storage } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = "student_admissions";
const BUCKET_ID = "6986e8a4001925504f6b";

export default function ExamPage() {

  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [examType, setExamType] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {

    try {

      const user = await account.get();

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal("createdById", user.$id)]
      );

      setStudents(response.documents);

    } catch (error) {
      console.log(error);
    }

  };


  const applyExam = async () => {

    if (!examType) {
      alert("Please select exam type");
      return;
    }

    try {

      for (let id of selectedIds) {

        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID,
          id,
          {
            examMode: examType,
            examStatus: "Applied"
          }
        );

      }

      alert("Exam applied successfully");

      setSelectedIds([]);
      fetchStudents();

    } catch (error) {
      console.log(error);
    }

  };

  return (

    <div className="p-10 bg-gray-100 min-h-screen">

      {/* HEADER */}

      <div className="flex justify-between items-center mb-8">

        <h2 className="text-3xl font-bold">
          Student Exam Management
        </h2>

        <div className="flex gap-4">

          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            className="border p-2 rounded-md bg-white"
          >

            <option value="">Select Exam Type</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>

          </select>

          <button
            onClick={applyExam}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md shadow"
          >
            Apply For Exam
          </button>

        </div>

      </div>

      {/* TABLE */}

      <div className="bg-white shadow rounded-lg overflow-hidden">

        <table className="w-full">

          <thead className="bg-yellow-200 text-left">

            <tr>

              <th className="p-3">Select</th>
              <th className="p-3">Status</th>
              <th className="p-3">Photo</th>
              <th className="p-3">Student Name</th>
              <th className="p-3">Course</th>
              <th className="p-3">Exam Mode</th>
              <th className="p-3">Course Fees</th>
              <th className="p-3">Balance</th>

            </tr>

          </thead>

          <tbody>

            {students.length === 0 ? (

              <tr>
                <td colSpan="8" className="text-center p-6">
                  No data available
                </td>
              </tr>

            ) : (

              students.map((item) => {

                const photoUrl = item.photoId
                  ? storage.getFilePreview(BUCKET_ID, item.photoId)
                  : null;

                return (

                  <tr key={item.$id} className="border-t hover:bg-gray-50">

                    <td className="p-3">

                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.$id)}
                        onChange={() => handleCheckbox(item.$id)}
                        className="w-4 h-4"
                      />

                    </td>

                    <td className="p-3">

                      <span className={`px-2 py-1 text-sm rounded ${item.examStatus === "Applied"
                        ? "bg-green-200 text-green-800"
                        : "bg-gray-200 text-gray-700"
                        }`}>
                        {item.examStatus || "Not Applied"}
                      </span>

                    </td>

                    <td className="p-3">

                      {item.photoId ? (

                        <img
                          src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${item.photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
                          className="w-16 h-16 rounded-full object-cover border shadow cursor-pointer"
                          onClick={() =>
                            setPreviewImage(
                              `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${item.photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
                            )
                          }
                        />

                      ) : (

                        <span className="text-gray-400">No Photo</span>

                      )}

                    </td>

                    <td className="p-3 font-medium">
                      {item.studentName}
                    </td>

                    <td className="p-3">
                      {item.course}
                    </td>

                    <td className="p-3">
                      {item.examMode || "-"}
                    </td>

                    <td className="p-3">
                      ₹ {item.totalFees || 0}
                    </td>

                    <td className="p-3 text-red-600 font-semibold">
                      ₹ {item.balance || 0}
                    </td>

                  </tr>

                );

              })

            )}

          </tbody>

        </table>

      </div>

      {/* IMAGE MODAL */}

      {previewImage && (

        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">

          <div className="relative">

            <img
              src={previewImage}
              className="max-w-xl max-h-[80vh] rounded-lg"
            />

            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 bg-white px-3 py-1 rounded shadow"
            >
              Close
            </button>

          </div>

        </div>

      )}

    </div>

  );

}


