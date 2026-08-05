"use client";

import { databases, account, ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";


const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function AddSemesterCoursePage() {

  const router = useRouter();

  const [loading, setLoading] = useState(false);

  // COURSE DETAILS
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [duration, setDuration] = useState("");
  const [totalSemesters, setTotalSemesters] = useState(1);
  const [courses, setCourses] = useState([]);
  const [editId, setEditId] = useState(null);
const [isEditing, setIsEditing] = useState(false);

const [viewSubjects, setViewSubjects] = useState([]);
const [showSubjectsModal, setShowSubjectsModal] = useState(false);


  const [award, setAward] = useState("");
const [customAward, setCustomAward] = useState("");

const awardList = [
  "CERTIFICATE",
  "DIPLOMA",
  "ADVANCE CERTIFICATE",
  "ADVANCE DIPLOMA",
  "MASTER DIPLOMA",
  "CERTIFICATE IN POST GRADUATE DIPLOMA",
  "PROFESSIONAL DIPLOMA",
  "ALL INDIA CERTIFICATE",
  "MASTER CERTIFICATE",
  "CERTIFICATE BASIC DIPLOMA",
  "ADVANCE",
  "CERTIFICATE IN PROFESSIONAL DIPLOMA",
  "POST GRADUATE",
  "POST GRADUATE DIPLOMA",
  "BASIC",
  "CERTIFICATE COURSE",
  "CERTIFICATION",
  "PRE-VOCATIONAL COURSE",
  "PERSONAL"
];

const fetchCourses = async () => {
  try {

    const res = await databases.listDocuments(
      DATABASE_ID,
      "semester_courses_master"
    );

    setCourses(res.documents);

  } catch (err) {
    console.log(err);
  }
};


useEffect(() => {
  fetchCourses();
}, []);



  // SEMESTERS
  const [semesters, setSemesters] = useState([
    {
      semesterNumber: 1,
      subjects: [],
    },
  ]);

  // ADD SEMESTER
  const addSemester = () => {

    const nextSemester = semesters.length + 1;

    setSemesters([
      ...semesters,
      {
        semesterNumber: nextSemester,
        subjects: [],
      },
    ]);

    setTotalSemesters(nextSemester);
  };

  // REMOVE SEMESTER
  const removeSemester = (semesterNumber) => {

    if (semesters.length === 1) {
      alert("At least one semester required");
      return;
    }

    const updated = semesters
      .filter((s) => s.semesterNumber !== semesterNumber)
      .map((s, index) => ({
        ...s,
        semesterNumber: index + 1,
      }));

    setSemesters(updated);

    setTotalSemesters(updated.length);
  };

  // ADD SUBJECT
  const addSubject = (semesterIndex) => {

    const updated = [...semesters];

updated[semesterIndex].subjects.push({
  subjectName: "",
  objectiveMarks: 50,
  practicalMarks: 50,
});
    setSemesters(updated);
  };

  // REMOVE SUBJECT
  const removeSubject = (semesterIndex, subjectIndex) => {

    const updated = [...semesters];

    updated[semesterIndex].subjects.splice(subjectIndex, 1);

    setSemesters(updated);
  };

  // UPDATE SUBJECT
  const updateSubject = (
    semesterIndex,
    subjectIndex,
    field,
    value
  ) => {

    const updated = [...semesters];

    updated[semesterIndex].subjects[subjectIndex][field] =
      value;

    setSemesters(updated);
  };

  const finalAward =
  award === "OTHER"
    ? customAward
    : award;



  // SAVE COURSE
  const saveCourse = async () => {

    try {

      setLoading(true);

      // VALIDATION
     if (
  !courseCode ||
  !courseName ||
  !duration ||
  !finalAward
) {
        alert("Fill all course details");
        return;
      }

      const user = await account.get();

      // CHECK DUPLICATE COURSE
      const existingCourse =
        await databases.listDocuments(
          DATABASE_ID,
          "semester_courses_master",
          [Query.equal("courseCode", courseCode)]
        );

      if (existingCourse.documents.length > 0) {
        alert("Course code already exists");
        return;
      }

      // GET EXAM FEES
     let examFees = 0;

const franchiseRes =
  await databases.listDocuments(
    DATABASE_ID,
    "franchise_approved",
    [Query.equal("email", user.email)]
  );

if (franchiseRes.documents.length > 0) {

  const franchise =
    franchiseRes.documents[0];

  const plan = franchise?.plan;

  if (plan) {

    const planRes =
      await databases.listDocuments(
        DATABASE_ID,
        "franchise_plans",
        [Query.equal("name", plan)]
      );

    examFees =
      planRes.documents[0]?.amount || 0;
  }
}


      // SAVE COURSE
if (isEditing) {

  await databases.updateDocument(
    DATABASE_ID,
    "semester_courses_master",
    editId,
    {
      courseCode,
      courseName:
        `${finalAward} IN ${courseName}`,
      award: finalAward,
      duration,
      totalSemesters,
      examFees,
    }
  );

} else {

  await databases.createDocument(
    DATABASE_ID,
    "semester_courses_master",
    ID.unique(),
    {
      courseCode,
      courseName:
        `${finalAward} IN ${courseName}`,
      award: finalAward,
      duration,
      totalSemesters,
      examFees,
      createdById: user.$id,
      createdAt:
        new Date().toISOString(),
    }
  );

}


if (isEditing) {

  const oldSubjects =
    await databases.listDocuments(
      DATABASE_ID,
      "semester_subjects_master",
      [
        Query.equal(
          "courseCode",
          courseCode
        )
      ]
    );

  for (const sub of oldSubjects.documents) {

    await databases.deleteDocument(
      DATABASE_ID,
      "semester_subjects_master",
      sub.$id
    );

  }

}


      // SAVE SUBJECTS
      for (const sem of semesters) {

        // CHECK DUPLICATE SUBJECTS
        const names = sem.subjects.map((s) =>
          s.subjectName.trim().toLowerCase()
        );

        const duplicate =
          names.length !== new Set(names).size;

        if (duplicate) {
          alert(
            `Duplicate subjects found in Semester ${sem.semesterNumber}`
          );
          return;
        }

        for (const sub of sem.subjects) {

          if (!sub.subjectName) continue;

          const objective =
            Number(sub.objectiveMarks) || 0;

          const practical =
            Number(sub.practicalMarks) || 0;

          await databases.createDocument(
            DATABASE_ID,
            "semester_subjects_master",
            ID.unique(),
            {
              courseCode,
              semesterNumber:
                sem.semesterNumber,
              subjectName:
                sub.subjectName,
              objectiveMarks: objective,
              practicalMarks: practical,
              totalMarks:
                objective + practical,
              createdById: user.$id,
            }
          );
        }
      }

      alert("Semester Course Added");
      fetchCourses();

      router.push(
        "/login/institute/add-course/semester-course"
      );

    } catch (error) {

  console.log("FULL ERROR:", error);

  alert(error.message);

}finally {

      setLoading(false);
    }
  };

  const handleViewSubjects = async (courseCode) => {

  try {

    const res = await databases.listDocuments(
      DATABASE_ID,
      "semester_subjects_master",
      [
        Query.equal("courseCode", courseCode),
        Query.orderAsc("semesterNumber")
      ]
    );

    setViewSubjects(res.documents);
    setShowSubjectsModal(true);

  } catch (err) {

    console.log(err);
    alert("Failed to load subjects");

  }

};

const handleEdit = async (course) => {

  try {

    setIsEditing(true);
    setEditId(course.$id);

    setCourseCode(course.courseCode);

    let cleanName = course.courseName;

    if (course.award) {
      cleanName = cleanName.replace(
        `${course.award} IN `,
        ""
      );
    }

    setCourseName(cleanName);

    setAward(course.award || "");
    setDuration(course.duration);

    const subjectRes =
      await databases.listDocuments(
        DATABASE_ID,
        "semester_subjects_master",
        [
          Query.equal(
            "courseCode",
            course.courseCode
          )
        ]
      );

    const semesterMap = {};

    subjectRes.documents.forEach((sub) => {

      const semNo =
        sub.semesterNumber;

      if (!semesterMap[semNo]) {

        semesterMap[semNo] = {
          semesterNumber: semNo,
          subjects: [],
        };

      }

      semesterMap[semNo].subjects.push({
        subjectName: sub.subjectName,
        objectiveMarks:
          sub.objectiveMarks,
        practicalMarks:
          sub.practicalMarks,
      });

    });

    const loadedSemesters =
      Object.values(semesterMap).sort(
        (a, b) =>
          a.semesterNumber -
          b.semesterNumber
      );

    setSemesters(loadedSemesters);

    setTotalSemesters(
      loadedSemesters.length
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  } catch (err) {

    console.log(err);

  }

};

  return (

    <div className="min-h-screen bg-[#07070a] text-white relative overflow-hidden p-3 sm:p-5 lg:p-10">

      {/* BG EFFECTS */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500/20 blur-[140px] rounded-full"></div>

      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500/20 blur-[140px] rounded-full"></div>

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-10">

          <h1 className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-orange-400 to-pink-500 text-transparent bg-clip-text">

            Add Semester Course

          </h1>

          <p className="text-gray-400 mt-3 text-sm sm:text-base">
            Create semester-wise courses with subjects
          </p>

        </div>

        {/* COURSE DETAILS */}
        <div className="glass-card mb-8">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-xl sm:text-2xl font-bold">
              Course Details
            </h2>

            <div className="bg-orange-500/20 border border-orange-500/30 text-orange-300 px-4 py-2 rounded-xl text-sm">

              {totalSemesters} Semester(s)

            </div>

          </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

  <input
    type="text"
    placeholder="Course Code"
    value={courseCode}
    onChange={(e) =>
      setCourseCode(e.target.value)
    }
    className="input"
  />

 <select
  value={award}
  onChange={(e) => setAward(e.target.value)}
  className="input"
  style={{
    color: "white",
    backgroundColor: "#1f1f23",
  }}
>
  <option value="">-- Select Award --</option>

  {awardList.map((a, i) => (
    <option key={i} value={a}>
      {a}
    </option>
  ))}

  <option value="OTHER">Other</option>
</select>

{award === "OTHER" && (
  <input
    type="text"
    placeholder="Enter Award"
    value={customAward}
    onChange={(e) => setCustomAward(e.target.value)}
    className="input mt-4"
  />
)}

  <input
    type="text"
    placeholder="Course Name"
    value={courseName}
    onChange={(e) =>
      setCourseName(e.target.value)
    }
    className="input"
  />

</div>

<div className="mt-5">

  <input
    type="text"
    placeholder="Duration (Example: 6 Months)"
    value={duration}
    onChange={(e) =>
      setDuration(e.target.value)
    }
    className="input"
  />

</div>

        </div>

        {/* ADD SEMESTER BUTTON */}
        <button
          onClick={addSemester}
          className="add-btn mb-8"
        >
          ➕ Add Semester
        </button>

        {/* SEMESTERS */}
        <div className="space-y-8">

          {semesters.map((semester, semIndex) => (

            <div
              key={semester.semesterNumber}
              className="glass-card"
            >

              {/* HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

                <div>

                  <h2 className="text-2xl font-bold text-orange-400">

                    Semester {semester.semesterNumber}

                  </h2>

                  <p className="text-gray-400 text-sm mt-1">

                    {semester.subjects.length} Subject(s)

                  </p>

                </div>

                <button
                  onClick={() =>
                    removeSemester(
                      semester.semesterNumber
                    )
                  }
                  className="delete-btn"
                >
                  Remove Semester
                </button>

              </div>

              {/* SUBJECTS */}
              <div className="space-y-5">

                {semester.subjects.map(
                  (subject, subjectIndex) => {

                    const total =
                      Number(
                        subject.objectiveMarks || 0
                      ) +
                      Number(
                        subject.practicalMarks || 0
                      );

                    return (

                      <div
                        key={subjectIndex}
                        className="subject-card"
                      >

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

                          <input
                            type="text"
                            placeholder="Subject Name"
                            value={
                              subject.subjectName
                            }
                            onChange={(e) =>
                              updateSubject(
                                semIndex,
                                subjectIndex,
                                "subjectName",
                                e.target.value
                              )
                            }
                            className="input"
                          />

                          <input
                            type="number"
                            placeholder="Objective Marks"
                            value={
                              subject.objectiveMarks
                            }
                            onChange={(e) =>
                              updateSubject(
                                semIndex,
                                subjectIndex,
                                "objectiveMarks",
                                e.target.value
                              )
                            }
                            className="input"
                          />

                          <input
                            type="number"
                            placeholder="Practical Marks"
                            value={
                              subject.practicalMarks
                            }
                            onChange={(e) =>
                              updateSubject(
                                semIndex,
                                subjectIndex,
                                "practicalMarks",
                                e.target.value
                              )
                            }
                            className="input"
                          />

                          <div className="flex gap-3">

                            <div className="total-box flex-1">

                              Total: {total}

                            </div>

                            <button
                              onClick={() =>
                                removeSubject(
                                  semIndex,
                                  subjectIndex
                                )
                              }
                              className="remove-subject-btn"
                            >
                              ✕
                            </button>

                          </div>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

              {/* ADD SUBJECT */}
              <button
                onClick={() =>
                  addSubject(semIndex)
                }
                className="secondary-btn mt-6"
              >
                + Add Subject
              </button>

            </div>
          ))}

        </div>

        {/* SAVE */}
        <button
          onClick={saveCourse}
          disabled={loading}
          className="save-btn mt-10"
        >
          {loading
            ? "Saving..."
            : "💾 Save Semester Course"}
        </button>

      </div>

      <div className="glass-card mt-10">

  <h2 className="text-2xl font-bold mb-5">
    All Semester Courses
  </h2>

  <div className="overflow-x-auto">

    <table className="w-full">

      <thead>

        <tr className="border-b border-white/10">

          <th className="p-3 text-left">
            Code
          </th>

          <th className="p-3 text-left">
            Course Name
          </th>

          <th className="p-3 text-left">
            Award
          </th>

          <th className="p-3 text-left">
            Duration
          </th>

         <th className="p-3 text-left">
  Semesters
</th>

<th className="p-3 text-left">
  Action
</th>

        </tr>

      </thead>

      <tbody>

        {courses.map((course) => (

          <tr
            key={course.$id}
            className="border-b border-white/5"
          >

            <td className="p-3">
              {course.courseCode}
            </td>

            <td className="p-3">
              {course.courseName}
            </td>

            <td className="p-3">
              {course.award}
            </td>

            <td className="p-3">
              {course.duration}
            </td>

<td className="p-3">
  {course.totalSemesters}
</td>
          <td className="p-3">

  <div className="flex gap-2">

    <button
      onClick={() =>
        handleViewSubjects(
          course.courseCode

        )
      }
      className="bg-blue-600 px-3 py-1 rounded"
    >
      View
    </button>

    <button
      onClick={() =>
        handleEdit(course)
      }
      className="bg-yellow-500 px-3 py-1 rounded"
    >
      Edit
    </button>

  </div>

</td>

          </tr>

        ))}

      </tbody>

    </table>

  </div>

</div>

{showSubjectsModal && (

  <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">

    <div className="bg-[#111] p-6 rounded-xl max-w-3xl w-full max-h-[80vh] overflow-auto">

      <div className="flex justify-between mb-5">

        <h2 className="text-2xl font-bold">
          Subjects
        </h2>

        <button
          onClick={() =>
            setShowSubjectsModal(false)
          }
        >
          ✕
        </button>

      </div>

      {viewSubjects.map((sub) => (

        <div
          key={sub.$id}
          className="border-b border-white/10 py-3"
        >

          <p>
            <strong>
              Semester:
            </strong>{" "}
            {sub.semesterNumber}
          </p>

          <p>
            <strong>
              Subject:
            </strong>{" "}
            {sub.subjectName}
          </p>

          <p>
            Objective:
            {sub.objectiveMarks}
          </p>

          <p>
            Practical:
            {sub.practicalMarks}
          </p>

        </div>

      ))}

    </div>

  </div>

)}

      <style jsx>{`

        .glass-card {
          background: rgba(255,255,255,0.06);

          backdrop-filter: blur(18px);

          border: 1px solid rgba(255,255,255,0.08);

          border-radius: 24px;

          padding: 20px;

          box-shadow:
            0 8px 32px rgba(0,0,0,0.35);

          transition: 0.3s;
        }

        .glass-card:hover {
          border-color: rgba(249,115,22,0.3);
        }

        .subject-card {
          background: rgba(255,255,255,0.04);

          border: 1px solid rgba(255,255,255,0.06);

          padding: 16px;

          border-radius: 18px;
        }

        .input {
          width: 100%;

          background: rgba(255,255,255,0.06);

          border: 1px solid rgba(255,255,255,0.08);

          padding: 14px;

          border-radius: 14px;

          color: white;

          outline: none;

          transition: 0.3s;
        }

        .input:focus {
          border-color: #f97316;

          box-shadow:
            0 0 20px rgba(249,115,22,0.25);
        }

        .total-box {
          background: rgba(249,115,22,0.15);

          border: 1px solid rgba(249,115,22,0.2);

          border-radius: 14px;

          display: flex;

          align-items: center;

          justify-content: center;

          font-weight: 700;

          color: #fdba74;
        }

        .add-btn,
        .save-btn,
        .secondary-btn,
        .delete-btn,
        .remove-subject-btn {
          transition: 0.3s;

          font-weight: 700;
        }

        .add-btn {
          background: linear-gradient(
            135deg,
            #f97316,
            #fb923c
          );

          color: black;

          padding: 14px 22px;

          border-radius: 16px;

          box-shadow:
            0 0 25px rgba(249,115,22,0.4);
        }

        .add-btn:hover {
          transform: translateY(-2px);
        }

        .secondary-btn {
          background: rgba(255,255,255,0.08);

          border: 1px solid rgba(255,255,255,0.08);

          padding: 12px 18px;

          border-radius: 14px;
        }

        .secondary-btn:hover {
          background: rgba(255,255,255,0.12);
        }

        .delete-btn {
          background: rgba(239,68,68,0.15);

          border: 1px solid rgba(239,68,68,0.2);

          color: #fca5a5;

          padding: 12px 16px;

          border-radius: 14px;
        }

        .delete-btn:hover {
          background: rgba(239,68,68,0.22);
        }

        .remove-subject-btn {
          width: 50px;

          background: rgba(239,68,68,0.15);

          border: 1px solid rgba(239,68,68,0.2);

          color: #fca5a5;

          border-radius: 14px;
        }

        .save-btn {
          width: 100%;

          background: linear-gradient(
            135deg,
            #f97316,
            #ec4899
          );

          padding: 18px;

          border-radius: 18px;

          color: white;

          font-size: 18px;

          box-shadow:
            0 0 35px rgba(249,115,22,0.35);
        }

        .save-btn:hover {
          transform: translateY(-3px);
        }

        @media (max-width: 640px) {

          .glass-card {
            padding: 16px;
          }

          .save-btn {
            font-size: 15px;
          }
        }

      `}</style>

    </div>
  );
}