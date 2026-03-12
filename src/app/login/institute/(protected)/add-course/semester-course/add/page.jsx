"use client";

import { useState } from "react";
import { databases, account, ID } from "@/lib/appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function AddSemesterCourse() {

  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [duration, setDuration] = useState("");

  const [semesters, setSemesters] = useState([]);

  const addSemester = () => {

    setSemesters([
      ...semesters,
      {
        semester: semesters.length + 1,
        subjects: []
      }
    ]);

  };

  const addSubject = (semIndex) => {

    const updated = [...semesters];

    updated[semIndex].subjects.push({
      subjectName: "",
      objective: "",
      practical: ""
    });

    setSemesters(updated);

  };

  const updateSubject = (semIndex, subIndex, field, value) => {

    const updated = [...semesters];

    updated[semIndex].subjects[subIndex][field] = value;

    setSemesters(updated);

  };

  const saveCourse = async () => {

    const user = await account.get();

    await databases.createDocument(
      DATABASE_ID,
      "semester_courses",
      ID.unique(),
      {
        courseCode,
        courseName,
        duration,
        totalSemesters: semesters.length,
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
            totalMarks: Number(sub.objective) + Number(sub.practical),
            createdById: user.$id
          }
        );

      }

    }

    alert("Semester Course Saved");

  };

  return (

    <div className="p-10 bg-black min-h-screen text-white">

      <h1 className="text-2xl font-bold mb-6">
        Add Semester Course
      </h1>

      <div className="bg-[#121212] border border-gray-800 p-6 rounded mb-6">

        <div className="grid grid-cols-3 gap-4">

          <input
            placeholder="Course Code"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            className="border border-gray-700 bg-black p-2"
          />

          <input
            placeholder="Course Name"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            className="border border-gray-700 bg-black p-2"
          />

          <input
            placeholder="Duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="border border-gray-700 bg-black p-2"
          />

        </div>

      </div>

      <button
        onClick={addSemester}
        className="bg-orange-500 hover:bg-orange-600 text-black px-5 py-2 rounded mb-6"
      >
        Add Semester
      </button>

      {semesters.map((sem, semIndex) => (

        <div key={semIndex} className="bg-[#121212] border border-gray-800 p-6 rounded mb-6">

          <h2 className="font-semibold mb-4">
            Semester {sem.semester}
          </h2>

          {sem.subjects.map((sub, subIndex) => (

            <div key={subIndex} className="grid grid-cols-3 gap-4 mb-4">

              <input
                placeholder="Subject Name"
                onChange={(e) =>
                  updateSubject(semIndex, subIndex, "subjectName", e.target.value)
                }
                className="border border-gray-700 bg-black p-2"
              />

              <input
                placeholder="Objective Marks"
                type="number"
                onChange={(e) =>
                  updateSubject(semIndex, subIndex, "objective", e.target.value)
                }
                className="border border-gray-700 bg-black p-2"
              />

              <input
                placeholder="Practical Marks"
                type="number"
                onChange={(e) =>
                  updateSubject(semIndex, subIndex, "practical", e.target.value)
                }
                className="border border-gray-700 bg-black p-2"
              />

            </div>

          ))}

          <button
            onClick={() => addSubject(semIndex)}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
          >
            Add Subject
          </button>

        </div>

      ))}

      <button
        onClick={saveCourse}
        className="bg-orange-500 hover:bg-orange-600 text-black px-6 py-3 rounded"
      >
        Save Course
      </button>

    </div>

  );

}