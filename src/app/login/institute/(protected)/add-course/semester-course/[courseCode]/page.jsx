"use client";

import { useEffect, useState } from "react";
import { databases, account, ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useParams } from "next/navigation";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function ManageSemesterCourse() {

  const params = useParams();
  const courseCode = params.courseCode;

  const [subjects, setSubjects] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [newSubjects, setNewSubjects] = useState({});
  const [course, setCourse] = useState(null);

  useEffect(() => {
    fetchSubjects();
    fetchCourse();
  }, []);

  // ✅ FETCH COURSE DETAILS
  const fetchCourse = async () => {
    const res = await databases.listDocuments(
      DATABASE_ID,
      "semester_courses",
      [Query.equal("courseCode", courseCode)]
    );
    setCourse(res.documents[0]);
  };

  // ✅ FETCH SUBJECTS
  const fetchSubjects = async () => {
    const res = await databases.listDocuments(
      DATABASE_ID,
      "semester_subjects",
      [Query.equal("courseCode", courseCode)]
    );

    setSubjects(res.documents);
    groupBySemester(res.documents);
  };

  // ✅ GROUP SUBJECTS BY SEMESTER
  const groupBySemester = (data) => {
    const groupedData = {};

    data.forEach((item) => {
      if (!groupedData[item.semesterNumber]) {
        groupedData[item.semesterNumber] = [];
      }
      groupedData[item.semesterNumber].push(item);
    });

    setGrouped(groupedData);
  };

  // ✅ ADD NEW SEMESTER
  const addSemester = () => {
    const existing = Object.keys(grouped).map(Number);
    const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;

    setGrouped({
      ...grouped,
      [next]: []
    });
  };

  // ✅ ADD SUBJECT INPUT
  const addSubjectInput = (sem) => {
    setNewSubjects((prev) => ({
      ...prev,
      [sem]: [
        ...(prev[sem] || []),
        { subjectName: "", objective: "", practical: "" }
      ]
    }));
  };

  // ✅ UPDATE INPUT
  const updateInput = (sem, index, field, value) => {
    const updated = [...(newSubjects[sem] || [])];
    updated[index][field] = value;

    setNewSubjects({
      ...newSubjects,
      [sem]: updated
    });
  };

  // ✅ SAVE SUBJECTS + UPDATE SEMESTER COUNT + DUPLICATE CHECK
  const saveSubjects = async (sem) => {

    const user = await account.get();
    const list = newSubjects[sem] || [];

    if (list.length === 0) {
      alert("Add at least one subject");
      return;
    }

    for (const sub of list) {

      // 🔥 DUPLICATE CHECK
      const existing = await databases.listDocuments(
        DATABASE_ID,
        "semester_subjects",
        [
          Query.equal("courseCode", courseCode),
          Query.equal("semesterNumber", Number(sem)),
          Query.equal("subjectName", sub.subjectName)
        ]
      );

      if (existing.documents.length > 0) {
        alert(`Subject "${sub.subjectName}" already exists in Semester ${sem}`);
        continue;
      }

      // ✅ SAVE SUBJECT
      await databases.createDocument(
        DATABASE_ID,
        "semester_subjects",
        ID.unique(),
        {
          courseCode,
          semesterNumber: Number(sem),
          subjectName: sub.subjectName,
          objectiveMarks: Number(sub.objective),
          practicalMarks: Number(sub.practical),
          totalMarks:
            Number(sub.objective) + Number(sub.practical),
          createdById: user.$id
        }
      );
    }

    // 🔥 UPDATE TOTAL SEMESTERS
    const allSemesters = [
      ...Object.keys(grouped).map(Number),
      Number(sem)
    ];

    const maxSemester = Math.max(...allSemesters);

    const courseRes = await databases.listDocuments(
      DATABASE_ID,
      "semester_courses",
      [Query.equal("courseCode", courseCode)]
    );

    const courseDoc = courseRes.documents[0];

    if (courseDoc) {
      await databases.updateDocument(
        DATABASE_ID,
        "semester_courses",
        courseDoc.$id,
        {
          totalSemesters: maxSemester
        }
      );
    }

    alert(`Semester ${sem} saved`);

    setNewSubjects({});
    fetchSubjects();
    fetchCourse();
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white p-10">

      <h1 className="text-3xl font-bold mb-6">
        Manage Course: {courseCode} {course && `- ${course.courseName}`}
      </h1>

      <button
        onClick={addSemester}
        className="bg-orange-500 px-4 py-2 rounded mb-6 text-black"
      >
        ➕ Add Semester
      </button>

      {Object.keys(grouped)
        .sort((a, b) => a - b)
        .map((sem) => (
          <div key={sem} className="bg-[#121212] p-6 rounded mb-6">

            <h2 className="text-xl text-orange-400 mb-4">
              Semester {sem}
            </h2>

            {/* ✅ EXISTING SUBJECTS */}
            {grouped[sem]?.map((sub, i) => (
              <div key={i} className="mb-2 text-gray-300">
                {sub.subjectName} 
                (Obj: {sub.objectiveMarks} | Prac: {sub.practicalMarks})
              </div>
            ))}

            {/* ✅ NEW SUBJECT INPUT */}
            {(newSubjects[sem] || []).map((sub, i) => (
              <div key={i} className="grid md:grid-cols-3 gap-4 mb-3">
                <input
                  placeholder="Subject Name"
                  className="input"
                  onChange={(e) =>
                    updateInput(sem, i, "subjectName", e.target.value)
                  }
                />
                <input
                  type="number"
                  placeholder="Objective"
                  className="input"
                  onChange={(e) =>
                    updateInput(sem, i, "objective", e.target.value)
                  }
                />
                <input
                  type="number"
                  placeholder="Practical"
                  className="input"
                  onChange={(e) =>
                    updateInput(sem, i, "practical", e.target.value)
                  }
                />
              </div>
            ))}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => addSubjectInput(sem)}
                className="bg-gray-700 px-3 py-1 rounded"
              >
                + Add Subject
              </button>

              <button
                onClick={() => saveSubjects(sem)}
                className="bg-green-500 px-3 py-1 rounded text-black"
              >
                Save Semester
              </button>
            </div>

          </div>
        ))}

      <style jsx>{`
        .input {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 10px;
          border-radius: 8px;
          color: white;
        }
      `}</style>

    </div>
  );
}