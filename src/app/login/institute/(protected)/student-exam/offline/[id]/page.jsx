"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { useParams, useRouter } from "next/navigation";
import { ID, Query } from "appwrite";

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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) loadStudent();
  }, [id]);

  useEffect(() => {
    const initSemester = async () => {
      if (
        student?.courseType === "semester" &&
        student?.courseCode &&
        selectedSem
      ) {
        const semesterSubjects = await loadSemesterSubjects(
          student.courseCode,
          selectedSem,
          student.franchiseEmail
        );

        await loadExistingResult(
          id,
          selectedSem,
          semesterSubjects
        );
      }
    };

    initSemester();
  }, [selectedSem, student, id]);

  const loadStudent = async () => {
    try {
      const res = await databases.getDocument(
        DATABASE_ID,
        ADMISSION_COLLECTION,
        id
      );

      setStudent(res);

      // ==========================================
      // SEMESTER SUPPORT
      // ==========================================
      if (res.courseType === "semester") {
        let courseCode = res.courseCode;

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

        const courseRes = await databases.listDocuments(
          DATABASE_ID,
          "franchise_semester_courses",
          [Query.equal("courseCode", courseCode)]
        );

        if (courseRes.documents.length > 0) {
          const courseData = courseRes.documents[0];
          setTotalSem(courseData.totalSemesters || 1);
        }

        res.courseCode = courseCode;
        setStudent(res);
        setSelectedSem(res.currentSemester || 1);

        return;
      }

      // ==========================================
      // SUBJECT LOADING
      // ==========================================
      let subjectList = [];

      // ==========================================
      // SINGLE COURSE
      // ==========================================
      if (res.courseType === "single") {
        let normalSingleCourse = null;

        try {
          // First: use courseId saved in admission
          if (res.courseId) {
            try {
              const courseRes = await databases.getDocument(
                DATABASE_ID,
                "courses_single",
                res.courseId
              );

              if (courseRes) {
                normalSingleCourse = courseRes;
              }
            } catch (courseIdError) {
              console.log(
                "COURSE ID LOOKUP FAILED:",
                courseIdError
              );
            }
          }

          // Fallback: find by course code
          if (!normalSingleCourse && res.courseCode) {
            const courseRes = await databases.listDocuments(
              DATABASE_ID,
              "courses_single",
              [
                Query.equal("courseCode", res.courseCode),
                Query.limit(1),
              ]
            );

            if (courseRes.documents.length > 0) {
              normalSingleCourse = courseRes.documents[0];
            }
          }

          // Fallback: find by course name
          if (!normalSingleCourse && res.courseName) {
            const courseRes = await databases.listDocuments(
              DATABASE_ID,
              "courses_single",
              [
                Query.equal("courseName", res.courseName),
                Query.limit(1),
              ]
            );

            if (courseRes.documents.length > 0) {
              normalSingleCourse = courseRes.documents[0];
            }
          }

          console.log(
            "SINGLE COURSE FOUND:",
            normalSingleCourse
          );

          // Load normal single-course subject
          if (normalSingleCourse) {
            const subjectRes = await databases.listDocuments(
              DATABASE_ID,
              "course_subjects",
              [
                Query.equal(
                  "courseId",
                  normalSingleCourse.$id
                ),
                Query.limit(1),
              ]
            );

            console.log(
              "SINGLE COURSE SUBJECT DOCUMENTS:",
              subjectRes.documents
            );

            if (subjectRes.documents.length > 0) {
              const subjectName =
                subjectRes.documents[0].subjectName?.trim();

              if (subjectName) {
                subjectList = [subjectName];
              }
            }
          }

          console.log(
            "FINAL SINGLE SUBJECT LIST:",
            subjectList
          );
        } catch (singleCourseError) {
          console.error(
            "SINGLE COURSE SUBJECT ERROR:",
            singleCourseError
          );
        }
      }

      // ==========================================
      // BEAUTY COURSE — UPDATED
      // ==========================================
      // Only the Beauty loading logic is changed.
      // The remaining course types are kept separate.
      // ==========================================
      else if (res.courseType === "beauty") {
        let beautyCourse = null;

        try {
          // 1. First try the saved course ID.
          if (res.courseId) {
            try {
              beautyCourse = await databases.getDocument(
                DATABASE_ID,
                "beauty_courses_single",
                res.courseId
              );
            } catch (courseIdError) {
              console.log(
                "BEAUTY COURSE ID LOOKUP FAILED:",
                courseIdError?.message || courseIdError
              );
            }
          }

          // 2. Find Beauty course by course code.
          if (!beautyCourse && res.courseCode) {
            const courseRes = await databases.listDocuments(
              DATABASE_ID,
              "beauty_courses_single",
              [
                Query.equal("courseCode", res.courseCode),
                Query.limit(10),
              ]
            );

            beautyCourse = courseRes.documents[0] || null;
          }

          // 3. Fall back to course name.
          if (!beautyCourse && res.courseName) {
            const courseRes = await databases.listDocuments(
              DATABASE_ID,
              "beauty_courses_single",
              [
                Query.equal("courseName", res.courseName),
                Query.limit(10),
              ]
            );

            beautyCourse = courseRes.documents[0] || null;
          }

          console.log(
            "BEAUTY COURSE FOUND:",
            beautyCourse
          );

          // 4. Load the Beauty subject.
          if (beautyCourse) {
            let beautySubject = null;

            // First, match the subject by Beauty course document ID.
            try {
              const subjectRes = await databases.listDocuments(
                DATABASE_ID,
                "beauty_courses_subjects",
                [
                  Query.equal("courseId", beautyCourse.$id),
                  Query.limit(100),
                ]
              );

              console.log(
                "BEAUTY SUBJECTS BY COURSE ID:",
                subjectRes.documents
              );

              beautySubject =
                subjectRes.documents.find(
                  (item) => item.subjectName?.trim()
                )?.subjectName?.trim() || null;
            } catch (subjectIdError) {
              console.warn(
                "BEAUTY SUBJECT LOOKUP BY courseId FAILED:",
                subjectIdError?.message || subjectIdError
              );
            }

            // 5. Fallback: match by course code.
            if (
              !beautySubject &&
              beautyCourse.courseCode
            ) {
              try {
                const subjectRes = await databases.listDocuments(
                  DATABASE_ID,
                  "beauty_courses_subjects",
                  [
                    Query.equal(
                      "courseCode",
                      beautyCourse.courseCode
                    ),
                    Query.limit(100),
                  ]
                );

                console.log(
                  "BEAUTY SUBJECTS BY COURSE CODE:",
                  subjectRes.documents
                );

                beautySubject =
                  subjectRes.documents.find(
                    (item) => item.subjectName?.trim()
                  )?.subjectName?.trim() || null;
              } catch (subjectCodeError) {
                console.warn(
                  "BEAUTY SUBJECT LOOKUP BY courseCode FAILED:",
                  subjectCodeError?.message || subjectCodeError
                );
              }
            }

            // 6. Fallback: use subjectName on the course document,
            // if that field exists and contains a value.
            if (
              !beautySubject &&
              beautyCourse.subjectName?.trim()
            ) {
              beautySubject =
                beautyCourse.subjectName.trim();
            }

            // 7. Final fallback: use a subject saved in admission.
            if (
              !beautySubject &&
              typeof res.subjects === "string"
            ) {
              beautySubject =
                res.subjects
                  .split("||")[0]
                  .split(",")[0]
                  .trim() || null;
            }

            if (beautySubject) {
              // Beauty course has one subject.
              subjectList = [beautySubject];
            } else {
              console.warn(
                "NO BEAUTY SUBJECT FOUND. Check the collection fields.",
                {
                  beautyCourseId: beautyCourse.$id,
                  courseCode:
                    beautyCourse.courseCode || res.courseCode,
                  courseName:
                    beautyCourse.courseName || res.courseName,
                }
              );
            }
          } else {
            console.warn(
              "NO BEAUTY COURSE FOUND:",
              {
                courseId: res.courseId,
                courseCode: res.courseCode,
                courseName: res.courseName,
              }
            );
          }

          console.log(
            "FINAL BEAUTY SUBJECT LIST:",
            subjectList
          );
        } catch (beautyError) {
          console.error(
            "BEAUTY COURSE SUBJECT ERROR:",
            beautyError
          );
        }
      }

      // ==========================================
      // MULTIPLE COURSE — UNCHANGED
      // ==========================================
      else if (res.courseType === "multiple") {
        if (res.subjects) {
          if (res.subjects.includes("||")) {
            // New format
            subjectList = res.subjects
              .split("||")
              .map((s) => s.trim())
              .filter(Boolean);
          } else {
            // Old format
            subjectList = res.subjects
              .split(/,\s*(?![^()]*\))/)
              .map((s) => s.trim())
              .filter(Boolean);
          }
        }
      }

      // ==========================================
      // FALLBACK — UNCHANGED
      // ==========================================
      else if (res.subjects) {
        subjectList = [res.subjects];
      }

      setSubjects(subjectList);

      const initialMarks = subjectList.map((sub) => ({
        subject: sub,
        theory: "",
        practical: "",
        total: 0,
      }));

      setMarks(initialMarks);
    } catch (err) {
      console.log(err);
    }
  };

  const loadExistingResult = async (
    studentId,
    semester,
    semesterSubjects = []
  ) => {
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        RESULT_COLLECTION,
        [
          Query.equal("studentId", studentId),
          Query.equal(
            "semesterNumber",
            Number(semester)
          ),
          Query.limit(1),
        ]
      );

      // No existing result for this semester
      if (!res.documents.length) {
        const blankMarks = semesterSubjects.map((sub) => ({
          subject: sub,
          theory: "",
          practical: "",
          total: 0,
        }));

        setMarks(blankMarks);
        return;
      }

      const result = res.documents[0];

      let parsed =
        typeof result.marksArray === "string"
          ? JSON.parse(result.marksArray)
          : result.marksArray;

      // Make sure marksArray is valid
      if (!Array.isArray(parsed)) {
        parsed = [];
      }

      // Remove invalid entries
      parsed = parsed.filter(
        (m) => m && typeof m === "object"
      );

      // Match saved marks with current semester subjects
      const restored = semesterSubjects.map((subject) => {
        const existing = parsed.find(
          (m) => m.subject === subject
        );

        // Subject has no saved marks yet
        if (!existing) {
          return {
            subject,
            theory: "",
            practical: "",
            total: 0,
          };
        }

        const theory = Number(
          existing.objective || 0
        );

        const practical = Number(
          existing.practical || 0
        );

        return {
          subject,
          theory,
          practical,
          total: theory + practical,
        };
      });

      setMarks(restored);
    } catch (err) {
      console.error(
        "LOAD RESULT ERROR:",
        err
      );
    }
  };

  const loadSemesterSubjects = async (
    courseCode,
    semester,
    franchiseEmail
  ) => {
    try {
      const semNumber = Number(semester);

      // Find subjects using course + semester
      let queries = [
        Query.equal("courseCode", courseCode),
        Query.equal("semesterNumber", semNumber),
      ];

      // Only add franchiseEmail when it exists
      if (franchiseEmail) {
        queries.push(
          Query.equal("franchiseEmail", franchiseEmail)
        );
      }

      const res = await databases.listDocuments(
        DATABASE_ID,
        "franchise_semester_course_subjects",
        queries
      );

      console.log("SEMESTER SUBJECT QUERY:", {
        courseCode,
        semester: semNumber,
        franchiseEmail,
        subjectsFound: res.documents.length,
      });

      const subjectList = res.documents
        .map((s) => s.subjectName)
        .filter(Boolean);

      console.log("SEMESTER SUBJECTS:", subjectList);

      const initialMarks = subjectList.map((sub) => ({
        subject: sub,
        theory: "",
        practical: "",
        total: 0,
      }));

      setSubjects(subjectList);
      setMarks(initialMarks);

      return subjectList;
    } catch (err) {
      console.error(
        "SEM SUBJECT ERROR:",
        err
      );

      alert(
        err?.message ||
          "Unable to load semester subjects"
      );

      setSubjects([]);
      setMarks([]);
      return [];
    }
  };

  const updateMarks = (index, field, value) => {
    // Allow the input to temporarily be empty
    if (value === "") {
      setMarks((prev) => {
        const updated = [...prev];

        updated[index] = {
          ...updated[index],
          [field]: "",
          total:
            Number(
              field === "theory"
                ? ""
                : updated[index].theory || 0
            ) +
            Number(
              field === "practical"
                ? ""
                : updated[index].practical || 0
            ),
        };

        return updated;
      });

      return;
    }

    let val = Number(value);

    // Prevent invalid numbers
    if (Number.isNaN(val)) {
      return;
    }

    // Maximum 50
    if (val > 50) {
      val = 50;
    }

    // Minimum 0
    if (val < 0) {
      val = 0;
    }

    setMarks((prev) => {
      const updated = [...prev];
      const current = updated[index];

      const theory =
        field === "theory"
          ? val
          : Number(current.theory || 0);

      const practical =
        field === "practical"
          ? val
          : Number(current.practical || 0);

      updated[index] = {
        ...current,
        [field]: val,
        total: theory + practical,
      };

      return updated;
    });
  };

  const calculateTotal = () => {
    return marks.reduce((sum, m) => sum + m.total, 0);
  };

  const calculatePercentage = () => {
    const total = calculateTotal();

    // Keep existing maximum-marks logic
    const maxMarks =
      student?.courseType === "single" ||
      student?.courseType === "beauty"
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
    if (saving) return;

    setSaving(true);

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

      // Check whether result already exists
      const existingResult = await databases.listDocuments(
        DATABASE_ID,
        RESULT_COLLECTION,
        [
          Query.equal("studentId", id),
          Query.equal(
            "semesterNumber",
            Number(selectedSem)
          ),
          Query.limit(1),
        ]
      );

      console.log("Student ID:", id);
      console.log(
        "Existing Results:",
        existingResult.documents
      );
      console.log(
        "Count:",
        existingResult.documents.length
      );

      let resultId;

      const resultData = {
        studentId: id,
        studentName: student.studentName || "",
        course: student.courseName || "",
        photoId: student.photoId || "",

        subjects: subjects.join(", "),

        semesterNumber: Number(selectedSem),

        status: "draft",

        certificateApplied: false,

        courseCode: student.courseCode,
        courseType: student.courseType,

        marksArray: JSON.stringify(
          marks.map((m) => ({
            subject: m.subject,
            objective: Number(m.theory || 0),
            practical: Number(m.practical || 0),
            total:
              Number(m.theory || 0) +
              Number(m.practical || 0),
          }))
        ),

        totalMarks: Number(totalMarks),
        percentage: Number(percentage),
        grade,

        franchiseId: student.franchiseId || "",
        instituteName: student.instituteName || "",

        createdById: user.$id,
        createdAt: new Date().toISOString(),
      };

      if (existingResult.documents.length > 0) {
        resultId = existingResult.documents[0].$id;

        const updatedDoc = await databases.updateDocument(
          DATABASE_ID,
          RESULT_COLLECTION,
          resultId,
          resultData
        );

        console.log("UPDATED:", updatedDoc.$id);
      } else {
        const newResult = await databases.createDocument(
          DATABASE_ID,
          RESULT_COLLECTION,
          ID.unique(),
          resultData
        );

        console.log("CREATED:", newResult.$id);
        resultId = newResult.$id;
      }

      // ===============================
      // UPDATE CERTIFICATE
      // ===============================
      const cert = await databases.listDocuments(
        DATABASE_ID,
        "certificates",
        [
          Query.equal("studentId", id),
          Query.limit(1),
        ]
      );

      if (cert.documents.length > 0) {
        await databases.updateDocument(
          DATABASE_ID,
          "certificates",
          cert.documents[0].$id,
          {
            totalMarks: Number(totalMarks),
            percentage: Number(percentage),
            marks: Number(percentage),
            grade: grade,
          }
        );
      }

      const oldSubjects = await databases.listDocuments(
        DATABASE_ID,
        "student_subject_results",
        [
          Query.equal("studentId", id),
          Query.equal(
            "semesterNumber",
            Number(selectedSem)
          ),
          Query.limit(500),
        ]
      );

      for (const doc of oldSubjects.documents) {
        await databases.deleteDocument(
          DATABASE_ID,
          "student_subject_results",
          doc.$id
        );
      }

      // ===============================
      // SAVE SUBJECT RESULTS
      // ===============================
      if (student.courseType === "multiple") {
        for (const m of marks) {
          await databases.createDocument(
            DATABASE_ID,
            "student_subject_results",
            ID.unique(),
            {
              studentId: id,

              semesterNumber: Number(selectedSem),

              subject: m.subject,

              objective: Number(m.theory || 0),
              practical: Number(m.practical || 0),
              total:
                Number(m.theory || 0) +
                Number(m.practical || 0),

              courseType: student.courseType,
              createdAt: new Date().toISOString(),
            }
          );
        }
      } else {
        for (const m of marks) {
          await databases.createDocument(
            DATABASE_ID,
            "student_subject_results",
            ID.unique(),
            {
              studentId: id,
              semesterNumber: Number(selectedSem),
              subject: m.subject || "Course",
              objective: Number(m.theory || 0),
              practical: Number(m.practical || 0),
              total:
                Number(m.theory || 0) +
                Number(m.practical || 0),

              courseType: student.courseType,
              createdAt: new Date().toISOString(),
            }
          );
        }
      }

      alert("Result Saved Successfully");
      router.push("/login/institute/student-exam/offline");
    } catch (err) {
      console.error("SAVE ERROR:", err);
      alert(err?.message || "Error saving result");
      setSaving(false);
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
              alt="Student"
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
              onChange={(e) =>
                setSelectedSem(Number(e.target.value))
              }
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
                      value={marks[index]?.theory ?? ""}
                      max={50}
                      min={0}
                      className="border p-2 w-24 bg-black text-white"
                      onChange={(e) =>
                        updateMarks(
                          index,
                          "theory",
                          e.target.value
                        )
                      }
                    />
                  </td>

                  <td className="border p-3">
                    <input
                      type="number"
                      value={marks[index]?.practical ?? ""}
                      max={50}
                      min={0}
                      className="border p-2 w-24 bg-black text-white"
                      onChange={(e) =>
                        updateMarks(
                          index,
                          "practical",
                          e.target.value
                        )
                      }
                    />
                  </td>

                  <td className="border p-3 font-bold">
                    {total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-3 gap-6">
          <div className="p-4 border">
            <p>Total Marks</p>
            <p className="text-xl">
              {calculateTotal()}
            </p>
          </div>

          <div className="p-4 border">
            <p>Percentage</p>
            <p className="text-xl">
              {calculatePercentage()} %
            </p>
          </div>

          <div className="p-4 border">
            <p>Grade</p>
            <p className="text-xl">
              {calculateGrade()}
            </p>
          </div>
        </div>

        <button
          onClick={saveResult}
          disabled={saving}
          className={`px-6 py-3 mt-6 rounded ${
            saving
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-orange-500 hover:bg-orange-600"
          }`}
        >
          {saving ? "Saving...please wait" : "Save Result"}
        </button>
      </div>
    </div>
  );
}