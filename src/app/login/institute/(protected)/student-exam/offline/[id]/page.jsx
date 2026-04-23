"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { useParams, useRouter } from "next/navigation";
import { ID } from "appwrite";
import { Query } from "appwrite";
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
  const [selectedSem, setSelectedSem] = useState(1);
  const [totalSem, setTotalSem] = useState(1);

  useEffect(() => {
    if (id) loadStudent();
  }, [id]);

useEffect(() => {
  if (
    student?.courseType === "semester" &&
    student?.courseCode &&
    selectedSem
  ) {
    loadSemesterSubjects(student.courseCode, selectedSem);
  }
}, [selectedSem, student]);


const loadStudent = async () => {
  try {

    const res = await databases.getDocument(
      DATABASE_ID,
      ADMISSION_COLLECTION,
      id
    );

    setStudent(res);

    // ✅ SEMESTER SUPPORT (NEW)
if (res.courseType === "semester") {

  let courseCode = res.courseCode;

  // 🔥 fallback if missing
  if (!courseCode) {
    const courseRes = await databases.listDocuments(
      DATABASE_ID,
      "semester_courses",
      [Query.equal("courseName", res.courseName)]
    );

    if (courseRes.documents.length > 0) {
      courseCode = courseRes.documents[0].courseCode;
    }
  }

  if (!courseCode) {
    alert("Course code not found");
    return;
  }

  // ✅ FETCH COURSE DETAILS (THIS IS THE KEY FIX)
  const courseRes = await databases.listDocuments(
    DATABASE_ID,
    "semester_courses",
    [Query.equal("courseCode", courseCode)]
  );

  if (courseRes.documents.length > 0) {

    const courseData = courseRes.documents[0];

    // 🔥 SET TOTAL SEMESTERS
    setTotalSem(courseData.totalSemesters || 1);

  }

  // ✅ STORE COURSE CODE
  setStudent((prev) => ({
    ...prev,
    courseCode
  }));

  // ✅ LOAD FIRST SEMESTER
  await loadSemesterSubjects(courseCode, 1);

  return;
}

    // ✅ OLD LOGIC (UNCHANGED)
    let subjectList = [];

    if (res.subjects) {

      if (res.courseType === "single" || res.courseType === "beauty") {

        subjectList = [
          res.subjects
            ?.split(",")
            .map(s => s.trim())
            .join(", ")
        ];

      } else {

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

const loadSemesterSubjects = async (courseCode, semester) => {

  try {

    const semNumber = Number(semester);

    console.log("FETCHING:", courseCode, semNumber);

    const res = await databases.listDocuments(
      DATABASE_ID,
      "semester_subjects",
      [
        Query.equal("courseCode", courseCode),
        Query.equal("semesterNumber", semNumber)
      ]
    );

    console.log("RESULT:", res.documents);

    if (res.documents.length === 0) {
      alert(`No subjects found for Semester ${semNumber}`);
    }

    const subjectList = [
  ...new Set(res.documents.map(s => s.subjectName))
];

    const initialMarks = subjectList.map(sub => ({
      subject: sub,
      theory: "",
      practical: "",
      total: 0
    }));

    setSubjects(subjectList);
    setMarks(initialMarks);

  } catch (err) {
    console.log("SEM ERROR:", err);
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

  // ✅ ADD THESE (IMPORTANT)
 semesterNumber: Number(selectedSem),
courseCode: student.courseCode,
courseType: student.courseType,

  // ✅ KEEP THIS (already correct)
  marksArray: JSON.stringify(
    marks.map((m) => ({
      subject: m.subject,
      objective: Number(m.theory || 0),
      practical: Number(m.practical || 0),
      total: Number(m.theory || 0) + Number(m.practical || 0)
    }))
  ),

  totalMarks: Number(totalMarks),
  percentage: Number(percentage),
  grade,

  franchiseId: student.franchiseId || "",
  instituteName: student.instituteName || "",

  createdById: user.$id,
  createdAt: new Date().toISOString()
}
);

// ===============================
// ✅ FINAL CORRECT SAVE LOGIC
// ===============================
if (student.courseType === "multiple") {

  for (const m of marks) {

    await databases.createDocument(
      DATABASE_ID,
      "student_subject_results",
      ID.unique(),
      {
        studentId: id,

        // ✅ SUBJECT COMES DIRECTLY FROM UI
        subject: m.subject,

        // ✅ CORRECT VALUES
        objective: Number(m.theory || 0),
        practical: Number(m.practical || 0),
        total:
          Number(m.theory || 0) +
          Number(m.practical || 0),

        courseType: student.courseType,
        createdAt: new Date().toISOString()
      }
    );
  }

} else {

  // ✅ KEEP SAME
  for (const m of marks) {

    await databases.createDocument(
      DATABASE_ID,
      "student_subject_results",
      ID.unique(),
      {
        studentId: id,
        subject: m.subject || "Course",
        objective: Number(m.theory || 0),
        practical: Number(m.practical || 0),
        total:
          Number(m.theory || 0) +
          Number(m.practical || 0),

        courseType: student.courseType,
        createdAt: new Date().toISOString()
      }
    );
  }

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
{student.courseType === "semester" && (
  <div className="mb-6">

    <label className="mr-3 font-semibold">
      Select Semester:
    </label>

<select
  value={selectedSem}
  onChange={(e) => setSelectedSem(Number(e.target.value))}
  className="border px-3 py-2 bg-black text-white"
>
  {[...Array(totalSem)].map((_, i) => (
    <option key={i} value={i + 1}>
      Semester {i + 1}
    </option>
  ))}
</select>

  </div>
)}
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

          <tbody key={selectedSem}>

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