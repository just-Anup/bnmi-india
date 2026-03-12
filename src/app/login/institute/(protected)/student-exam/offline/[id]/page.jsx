"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { useParams, useRouter } from "next/navigation";
import { ID } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const ADMISSION_COLLECTION = "student_admissions";
const RESULT_COLLECTION = "exam_results";
const BUCKET_ID = "6986e8a4001925504f6b";

export default function ResultPage() {

  const { id } = useParams();
  const router = useRouter();

  const [student, setStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [marks, setMarks] = useState([]);

  useEffect(() => {
    loadStudent();
  }, []);

  const loadStudent = async () => {

    try {

      const res = await databases.getDocument(
        DATABASE_ID,
        ADMISSION_COLLECTION,
        id
      );

      setStudent(res);

      let subjectList = [];

      if (res.subjects) {

        subjectList = res.subjects
          .split(",")
          .map(s => s.trim());

      }

      setSubjects(subjectList);

      const initialMarks = subjectList.map(sub => ({
        subject: sub,
        theory: "",
        practical: "",
        total: 0
      }));

      setMarks(initialMarks);

    } catch (err) {

      console.log(err);

    }

  };

  const updateMarks = (index, field, value) => {

    const updated = [...marks];

    updated[index][field] = Number(value);

    updated[index].total =
      Number(updated[index].theory || 0) +
      Number(updated[index].practical || 0);

    setMarks(updated);

  };

  const calculateTotal = () => {

    let total = 0;

    marks.forEach(m => {
      total += m.total;
    });

    return total;

  };

  const calculatePercentage = () => {

    const total = calculateTotal();
    const maxMarks = subjects.length * 100;

    if (maxMarks === 0) return 0;

    return Math.round((total / maxMarks) * 100);

  };

  const calculateGrade = () => {

    const percentage = calculatePercentage();

    if (percentage >= 80) return "A";
    if (percentage >= 60) return "B";
    if (percentage >= 40) return "C";

    return "F";

  };

  const saveResult = async () => {

    try {

      const user = await account.get();

      const totalMarks = calculateTotal();
      const percentage = calculatePercentage();
      const grade = calculateGrade();

      await databases.createDocument(
        DATABASE_ID,
        RESULT_COLLECTION,
        ID.unique(),
        {
          studentId: id,
          studentName: student.studentName,
          course: student.courseName,
          photoId: student.photoId,
          subjects: subjects.join(", "),
          marks: JSON.stringify(marks),
          totalMarks,
          percentage,
          grade,

          franchiseId: student.franchiseId,
          instituteName: student.instituteName,

          createdById: user.$id,
          createdAt: new Date().toISOString()
        }
      )

      alert("Result Saved Successfully");

      router.push("/login/institute/student-exam/offline");

    } catch (err) {

      console.log(err);
      alert("Error saving result");

    }

  };

  if (!student) {
    return <div className="p-10 bg-black text-white min-h-screen">Loading...</div>
  }

  const photoUrl = student.photoId
    ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
    : null;

  return (

    <div className="p-10 bg-black min-h-screen text-white">

      <h2 className="text-2xl font-bold mb-6">
        Update Practical Exam Result
      </h2>

      {/* Student Info */}

      <div className="bg-[#121212] border border-gray-800 p-6 rounded shadow mb-6">

        <div className="flex items-center gap-6">

          {photoUrl && (
            <img
              src={photoUrl}
              className="w-24 h-24 rounded-full object-cover"
            />
          )}

          <div>

            <p className="text-lg font-semibold">
              Student Name : {student.studentName}
            </p>

            <p>
              Course : {student.courseName}
            </p>

          </div>

        </div>

      </div>

      {/* Marks Table */}

      <div className="bg-[#121212] border border-gray-800 p-6 rounded shadow">

        <table className="w-full border border-gray-800">

          <thead className="bg-orange-500 text-black">

            <tr>

              <th className="border border-gray-800 p-3">Subject</th>
              <th className="border border-gray-800 p-3">Max Marks</th>
              <th className="border border-gray-800 p-3">Theory Marks</th>
              <th className="border border-gray-800 p-3">Practical Marks</th>
              <th className="border border-gray-800 p-3">Total</th>

            </tr>

          </thead>

          <tbody>

            {subjects.map((sub, index) => {

              const total = marks[index]?.total || 0;

              return (

                <tr key={index} className="border-t border-gray-800 hover:bg-[#1a1a1a]">

                  <td className="border border-gray-800 p-3">
                    {sub}
                  </td>

                  <td className="border border-gray-800 p-3">
                    100
                  </td>

                  <td className="border border-gray-800 p-3">

                    <input
                      type="number"
                      className="border border-gray-700 bg-black text-white p-2 w-24 rounded"
                      onChange={(e) =>
                        updateMarks(index, "theory", e.target.value)
                      }
                    />

                  </td>

                  <td className="border border-gray-800 p-3">

                    <input
                      type="number"
                      className="border border-gray-700 bg-black text-white p-2 w-24 rounded"
                      onChange={(e) =>
                        updateMarks(index, "practical", e.target.value)
                      }
                    />

                  </td>

                  <td className="border border-gray-800 p-3 font-semibold">
                    {total}
                  </td>

                </tr>

              )

            })}

          </tbody>

        </table>

        {/* Summary */}

        <div className="mt-6 grid grid-cols-3 gap-6">

          <div className="bg-black border border-gray-800 p-4 rounded">

            <p>Total Marks</p>
            <p className="text-xl font-bold">
              {calculateTotal()}
            </p>

          </div>

          <div className="bg-black border border-gray-800 p-4 rounded">

            <p>Percentage</p>
            <p className="text-xl font-bold">
              {calculatePercentage()} %
            </p>

          </div>

          <div className="bg-black border border-gray-800 p-4 rounded">

            <p>Grade</p>
            <p className="text-xl font-bold">
              {calculateGrade()}
            </p>

          </div>

        </div>

        <button
          onClick={saveResult}
          className="bg-orange-500 hover:bg-orange-600 text-black font-semibold px-6 py-3 rounded mt-6"
        >
          Save Result
        </button>

      </div>

    </div>

  );

}