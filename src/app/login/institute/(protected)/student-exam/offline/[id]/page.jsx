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
    if (id) loadStudent();
  }, [id]);

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

      // ✅ SINGLE + BEAUTY → ONE ROW (BUT SHOW ALL SUBJECT NAMES)
      if (res.courseType === "single" || res.courseType === "beauty") {

        subjectList = [
          res.subjects
            ?.split(",")
            .map(s => s.trim())
            .join(", ")
        ];

      } else {

        // ✅ MULTIPLE → MULTIPLE ROWS
        subjectList = res.subjects
          ?.split(",")
          .map(s => s.trim());

      }
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
    return marks.reduce((sum, m) => sum + m.total, 0);
  };

  const calculatePercentage = () => {

    const total = calculateTotal();

    // 🔥 FIX MAX MARKS
    const maxMarks =
      student?.courseType === "single" || student?.courseType === "beauty"
        ? 100
        : subjects.length * 100;

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

    if (!student) {
      alert("Student not loaded");
      return;
    }

    if (marks.length === 0) {
      alert("No subjects available");
      return;
    }

    try {

      const user = await account.get();

      const totalMarks = calculateTotal();
      const percentage = calculatePercentage();
      const grade = calculateGrade();

      const resultDoc = await databases.createDocument(
        DATABASE_ID,
        RESULT_COLLECTION,
        ID.unique(),
        {
          studentId: id,
          studentName: student.studentName || "",
          course: student.courseName || "",
          photoId: student.photoId || "",
          subjects: subjects.join(", "),
          marks: JSON.stringify(marks),
          totalMarks: Number(totalMarks),
          percentage: Number(percentage),
          grade,

          franchiseId: student.franchiseId || "",
          instituteName: student.instituteName || "",

          createdById: user.$id,
          createdAt: new Date().toISOString()
        }
      );

      // 🔥 SAVE SUBJECT MARKS (ONLY 1 FOR SINGLE/BEAUTY)
      for (const m of marks) {
        await databases.createDocument(
          DATABASE_ID,
          "exam_subject_marks",
          ID.unique(),
          {
            studentId: id,
            resultId: resultDoc.$id,
            subject:
              student.courseType === "single" || student.courseType === "beauty"
                ? "Course"
                : m.subject,

            theory: Number(m.theory || 0),
            practical: Number(m.practical || 0),
            total: Number(m.theory || 0) + Number(m.practical || 0),

            createdById: user.$id,
            createdAt: new Date().toISOString()
          }
        );
      }

      alert("Result Saved Successfully");
      router.push("/login/institute/student-exam/offline");

    } catch (err) {
      console.error("SAVE ERROR:", err);
      alert(err?.message || "Error saving result");
    }
  };

  const photoUrl = student?.photoId
    ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
    : null;

  if (!student) {
    return (
      <div className="p-10 text-white bg-black min-h-screen">
        Loading student data...
      </div>
    );
  }

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
              <th className="border p-3">Subject</th>
              <th className="border p-3">Max Marks</th>
              <th className="border p-3">Theory</th>
              <th className="border p-3">Practical</th>
              <th className="border p-3">Total</th>
            </tr>
          </thead>

          <tbody>

            {subjects.map((sub, index) => {

              const total = marks[index]?.total || 0;

              return (
                <tr key={index}>

                  <td className="border p-3">
                    {sub}
                  </td>

                  <td className="border p-3">100</td>

                  <td className="border p-3">
                    <input
                      type="number"
                      className="border p-2 w-24 bg-black text-white"
                      onChange={(e) =>
                        updateMarks(index, "theory", e.target.value)
                      }
                    />
                  </td>

                  <td className="border p-3">
                    <input
                      type="number"
                      className="border p-2 w-24 bg-black text-white"
                      onChange={(e) =>
                        updateMarks(index, "practical", e.target.value)
                      }
                    />
                  </td>

                  <td className="border p-3 font-bold">{total}</td>

                </tr>
              );
            })}

          </tbody>

        </table>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-3 gap-6">

          <div className="p-4 border">
            <p>Total Marks</p>
            <p className="text-xl">{calculateTotal()}</p>
          </div>

          <div className="p-4 border">
            <p>Percentage</p>
            <p className="text-xl">{calculatePercentage()} %</p>
          </div>

          <div className="p-4 border">
            <p>Grade</p>
            <p className="text-xl">{calculateGrade()}</p>
          </div>

        </div>

        <button
          onClick={saveResult}
          className="bg-orange-500 px-6 py-3 mt-6 rounded"
        >
          Save Result
        </button>

      </div>

    </div>
  );
}