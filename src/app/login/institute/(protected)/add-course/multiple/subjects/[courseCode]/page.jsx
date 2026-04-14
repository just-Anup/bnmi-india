"use client";

import { useEffect, useState } from "react";
import { databases, account, ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useParams, useRouter, useSearchParams } from "next/navigation";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function SubjectPage() {

  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const courseId = params.courseId;
  const courseName = searchParams.get("name");
  const courseCode = searchParams.get("code");
  const courseDuration = searchParams.get("duration");

  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [courseFees, setCourseFees] = useState("");
  const [minimumFees, setMinimumFees] = useState("");

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    const res = await databases.listDocuments(
      DATABASE_ID,
      "subjects_master",
      [Query.equal("courseCode", courseCode)]
    );

    setSubjects(res.documents);
  };

const toggleSubject = (name) => {
  setSelectedSubjects((prev) => {
    // ❌ If already selected → remove
    if (prev.includes(name)) {
      return prev.filter((s) => s !== name);
    }

    // 🚫 Limit to 10 subjects
    if (prev.length >= 10) {
      alert("You can select maximum 10 subjects");
      return prev;
    }

    // ✅ Add in order
    return [...prev, name];
  });
};
  const saveCourse = async () => {

    if (selectedSubjects.length === 0) {
      alert("Select at least one subject");
      return;
    }

    const user = await account.get();

    await databases.createDocument(
      DATABASE_ID,
      "franchise_multiple_courses",
      ID.unique(),
      {
        courseId,
        courseName,
        courseCode,
        subjects: selectedSubjects.join(", "),
        duration: courseDuration || "",
        courseFees: Number(courseFees),
        minimumFees: Number(minimumFees),
        franchiseEmail: user.email,
        createdById: user.$id,
        status: "Active"
      }
    );

    alert("Course Saved");
    router.push("/login/institute/add-course/multiple/list");
  };

  return (

    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-gray-900 text-white">

      <div className="w-full max-w-lg bg-[#121212] border border-gray-800 rounded-2xl shadow-xl p-8">

        <h1 className="text-2xl font-bold mb-2">
          {courseName}
        </h1>

        <p className="text-gray-400 mb-6">
          Select subjects and configure fees
        </p>

        {/* SUBJECT LIST */}
        <div className="max-h-52 overflow-y-auto mb-6 space-y-2">

          {subjects.map(s => (

            <label
              key={s.$id}
              className="flex items-center gap-3 p-2 rounded hover:bg-[#1a1a1a] cursor-pointer"
            >

              <input
                type="checkbox"
                onChange={() => toggleSubject(s.subjectName)}
                className="accent-orange-500"
              />

          <span className="flex justify-between w-full">
  {s.subjectName}

  {selectedSubjects.includes(s.subjectName) && (
    <span className="bg-orange-500 text-black px-2 py-0.5 rounded text-xs">
      {selectedSubjects.indexOf(s.subjectName) + 1}
    </span>
  )}
</span>

            </label>

          ))}

        </div>

        {/* INPUTS */}
        <div className="space-y-4">

          <input
            type="number"
            placeholder="Course Fees"
            onChange={(e) => setCourseFees(e.target.value)}
            className="w-full p-3 rounded-lg bg-black border border-gray-700 focus:border-orange-500 outline-none"
          />

          <input
            type="number"
            placeholder="Minimum Fees"
            onChange={(e) => setMinimumFees(e.target.value)}
            className="w-full p-3 rounded-lg bg-black border border-gray-700 focus:border-orange-500 outline-none"
          />

        </div>

        {/* BUTTON */}
        <button
          onClick={saveCourse}
          className="w-full mt-6 bg-orange-500 hover:bg-orange-600 transition py-3 rounded-lg font-semibold text-black shadow-lg"
        >
          Save Course
        </button>

      </div>

    </div>
  );
}