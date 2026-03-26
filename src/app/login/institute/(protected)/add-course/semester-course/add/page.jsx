"use client";

import { useState } from "react";
import { databases, account, ID } from "@/lib/appwrite";
import { useRouter } from "next/navigation";
import { Query } from "appwrite"; // ✅ ADD THIS
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function AddSemesterCourse() {
const router = useRouter();
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [duration, setDuration] = useState("");
  const [semesters, setSemesters] = useState([]);

  const addSemester = () => {
    setSemesters([...semesters, { semester: semesters.length + 1, subjects: [] }]);
  };

  const addSubject = (semIndex) => {
    const updated = [...semesters];
    updated[semIndex].subjects.push({ subjectName: "", objective: "", practical: "" });
    setSemesters(updated);
  };

  const updateSubject = (semIndex, subIndex, field, value) => {
    const updated = [...semesters];
    updated[semIndex].subjects[subIndex][field] = value;
    setSemesters(updated);
  };

const saveCourse = async () => {
  const user = await account.get();

const res = await databases.listDocuments(
  DATABASE_ID,
  "franchise_approved",
  [Query.equal("$id", user.$id)]
);
const franchise = res.documents[0];

// ✅ GET FROM DB
const institutePlans = {
  HOJAI: 400,
  BIHAR: 499,
  "ARUNACHAL PRADESH": 499,
  BEAUTY: 500
};

const plan = franchise?.plan;
const examFee = institutePlans[plan] || 0;


  await databases.createDocument(
    DATABASE_ID,
    "semester_courses",
    ID.unique(),
    {
      courseCode,
      courseName,
      duration,
      totalSemesters: semesters.length,
       examFees: examFee, // ✅ ADD THIS
      createdById: user.$id,
      createdAt: new Date().toISOString()
    }
  );

  for (const sem of semesters) {
    for (const sub of sem.subjects) {
      await databases.createDocument(
        DATABASE_ID,
        "semester_subjects",
        ID.unique(),
        {
          courseCode,
          semesterNumber: sem.semester,
          subjectName: sub.subjectName,
          objectiveMarks: Number(sub.objective),
          practicalMarks: Number(sub.practical),
          totalMarks:
            Number(sub.objective) + Number(sub.practical),
          createdById: user.$id
        }
      );
    }
  }

  // 🔥 Redirect after save
  router.push("/login/institute/add-course/semester-course");
};
  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white p-10 relative overflow-hidden">

      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500 opacity-20 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 opacity-20 blur-3xl"></div>

      <div className="max-w-6xl mx-auto relative z-10">

        <h1 className="text-4xl font-bold mb-10 bg-gradient-to-r from-orange-400 to-pink-500 text-transparent bg-clip-text">
          Add Semester Course
        </h1>

        {/* Course Card */}
        <div className="cool-card mb-8">

          <h2 className="text-lg text-gray-300 mb-4">Course Details</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <input className="input" placeholder="Course Code" onChange={(e)=>setCourseCode(e.target.value)} />
            <input className="input" placeholder="Course Name" onChange={(e)=>setCourseName(e.target.value)} />
            <input className="input" placeholder="Duration" onChange={(e)=>setDuration(e.target.value)} />
          </div>

        </div>

        <button onClick={addSemester} className="btn-glow mb-8">
          ➕ Add Semester
        </button>

        {semesters.map((sem, semIndex) => (
          <div key={semIndex} className="cool-card mb-6">

            <h2 className="text-xl text-orange-400 mb-4">
              Semester {sem.semester}
            </h2>

            {sem.subjects.map((sub, subIndex) => (
              <div key={subIndex} className="grid md:grid-cols-3 gap-4 mb-4">
                <input className="input" placeholder="Subject Name"
                  onChange={(e)=>updateSubject(semIndex, subIndex,"subjectName",e.target.value)} />
                <input className="input" type="number" placeholder="Objective"
                  onChange={(e)=>updateSubject(semIndex, subIndex,"objective",e.target.value)} />
                <input className="input" type="number" placeholder="Practical"
                  onChange={(e)=>updateSubject(semIndex, subIndex,"practical",e.target.value)} />
              </div>
            ))}

            <button onClick={()=>addSubject(semIndex)} className="btn-secondary">
              + Add Subject
            </button>

          </div>
        ))}

        <button onClick={saveCourse} className="btn-glow w-full mt-6">
          💾 Save Course
        </button>

      </div>

      <style jsx>{`
        .cool-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 24px;
          backdrop-filter: blur(12px);
          transition: 0.3s;
        }

        .cool-card:hover {
          transform: translateY(-4px);
          border-color: rgba(249,115,22,0.5);
        }

        .input {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 12px;
          border-radius: 10px;
          color: white;
        }

        .input:focus {
          border-color: #f97316;
          box-shadow: 0 0 10px rgba(249,115,22,0.5);
        }

        .btn-glow {
          background: linear-gradient(135deg,#f97316,#fb923c);
          padding: 12px 20px;
          border-radius: 12px;
          font-weight: 600;
          transition: 0.3s;
          box-shadow: 0 0 15px rgba(249,115,22,0.5);
        }

        .btn-glow:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 25px rgba(249,115,22,0.8);
        }

        .btn-secondary {
          background: rgba(255,255,255,0.08);
          padding: 10px;
          border-radius: 8px;
        }
      `}</style>

    </div>
  );
}