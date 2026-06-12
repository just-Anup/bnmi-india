"use client";

import { useEffect, useState } from "react";

import {
  databases,
  account,
  ID,
} from "@/lib/appwrite";

import { Query } from "appwrite";

import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function SelectSemesterPage() {

  const params = useParams();

  const router = useRouter();

  const searchParams =
    useSearchParams();

  const courseId =
    params.courseId;

  const courseName =
    searchParams.get("name");

  const courseCode =
    searchParams.get("code");

  const duration =
    searchParams.get("duration");

  const totalSemester =
    searchParams.get("semester");

  const [subjects,
    setSubjects] =
    useState([]);

  const [selectedSemesters,
    setSelectedSemesters] =
    useState([]);

  const [groupedSubjects,
    setGroupedSubjects] =
    useState({});

  const [courseFees,
    setCourseFees] =
    useState("");

  const [minimumFees,
    setMinimumFees] =
    useState("");

  const [loading,
    setLoading] =
    useState(false);

  useEffect(() => {

    fetchSubjects();

  }, []);

  // FETCH SUBJECTS
  const fetchSubjects =
    async () => {

      try {

        const res =
          await databases.listDocuments(
            DATABASE_ID,
            "semester_subjects_master",
            [
              Query.equal(
                "courseCode",
                courseCode
              ),
              Query.orderAsc(
                "semesterNumber"
              ),
            ]
          );

        setSubjects(
          res.documents
        );

        // GROUP SEMESTER
        const grouped = {};

        res.documents.forEach(
          (subject) => {

            const sem =
              subject.semesterNumber;

            if (
              !grouped[sem]
            ) {
              grouped[sem] = [];
            }

            grouped[sem].push(
              subject
            );
          }
        );

        setGroupedSubjects(
          grouped
        );

      } catch (error) {

        console.log(error);
      }
    };

  // TOGGLE SEMESTER
  const toggleSemester =
    (semester) => {

      setSelectedSemesters(
        (prev) => {

          if (
            prev.includes(
              semester
            )
          ) {

            return prev.filter(
              (s) =>
                s !== semester
            );
          }

          return [
            ...prev,
            semester,
          ];
        }
      );
    };

  // SAVE COURSE
  const saveCourse =
    async () => {

      try {

        setLoading(true);

        if (
          selectedSemesters.length === 0
        ) {
          alert(
            "Select at least one semester"
          );

          return;
        }

        if (
          !courseFees ||
          
          !minimumFees
        ) {
          alert(
            "Please enter fees"
          );

          return;
        }

        const user =
          await account.get();

        // CHECK DUPLICATE
        const existing =
          await databases.listDocuments(
            DATABASE_ID,
            "franchise_semester_courses",
            [
              Query.equal(
                "courseId",
                courseId
              ),
              Query.equal(
                "franchiseEmail",
                user.email
              ),
            ]
          );

        if (
          existing.documents.length > 0
        ) {
          alert(
            "Course already added"
          );

          return;
        }

        // SAVE
        await databases.createDocument(
          DATABASE_ID,
          "franchise_semester_courses",
          ID.unique(),
          {
            courseId,
            courseCode,
            courseName,
            duration,

            totalSemesters:
              Number(
                totalSemester
              ),

            selectedSemesters:
              selectedSemesters.join(
                "||"
              ),

            courseFees:
              Number(
                courseFees
              ),

            minimumFees:
              Number(
                minimumFees
              ),

            franchiseEmail:
              user.email,

            createdById:
              user.$id,

            status: "Active",
          }
        );

        alert(
          "Semester Course Added"
        );

        router.push(
          "/login/institute/add-course/semester-course/list"
        );

      } catch (error) {

        console.log(error);

        alert(
          error.message
        );

      } finally {

        setLoading(false);
      }
    };

  return (

    <div className="min-h-screen bg-[#07070a] text-white relative overflow-hidden p-3 sm:p-5 lg:p-10">

      {/* BG */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500/20 blur-[140px] rounded-full"></div>

      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500/20 blur-[140px] rounded-full"></div>

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">

          <h1 className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-orange-400 to-pink-500 text-transparent bg-clip-text">

            {courseName}

          </h1>

          <p className="text-gray-400 mt-3">

            Select semesters for this course

          </p>

        </div>

        {/* COURSE INFO */}
        <div className="glass-card mb-8">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            <div className="info-box">

              <span className="label">
                Course Code
              </span>

              <span className="value orange">

                {courseCode}

              </span>

            </div>

            <div className="info-box">

              <span className="label">
                Duration
              </span>

              <span className="value">

                {duration}

              </span>

            </div>

            <div className="info-box">

              <span className="label">
                Total Semester
              </span>

              <span className="value blue">

                {totalSemester}

              </span>

            </div>

          </div>

        </div>

        {/* SEMESTERS */}
        <div className="space-y-8">

          {Object.keys(
            groupedSubjects
          ).map((semester) => {

            const isSelected =
              selectedSemesters.includes(
                semester
              );

            return (

              <div
                key={semester}
                className={`semester-card ${
                  isSelected
                    ? "active-card"
                    : ""
                }`}
              >

                {/* HEADER */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-6">

                  <div>

                    <h2 className="text-2xl font-bold text-orange-400">

                      Semester {semester}

                    </h2>

                    <p className="text-gray-400 mt-1">

                      {
                        groupedSubjects[
                          semester
                        ].length
                      }{" "}
                      Subjects

                    </p>

                  </div>

                  <button
                    onClick={() =>
                      toggleSemester(
                        semester
                      )
                    }
                    className={`select-btn ${
                      isSelected
                        ? "selected-btn"
                        : ""
                    }`}
                  >

                    {isSelected
                      ? "Selected"
                      : "Select Semester"}

                  </button>

                </div>

                {/* SUBJECTS */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                  {groupedSubjects[
                    semester
                  ].map((subject) => (

                    <div
                      key={subject.$id}
                      className="subject-card"
                    >

                      <div className="font-semibold text-white mb-3">

                        {
                          subject.subjectName
                        }

                      </div>

                      <div className="flex justify-between text-sm text-gray-400">

                        <span>

                          Obj:
                          {" "}
                          {
                            subject.objectiveMarks
                          }

                        </span>

                        <span>

                          Prac:
                          {" "}
                          {
                            subject.practicalMarks
                          }

                        </span>

                        <span className="text-orange-300 font-bold">

                          Total:
                          {" "}
                          {
                            subject.totalMarks
                          }

                        </span>

                      </div>

                    </div>
                  ))}

                </div>

              </div>
            );
          })}

        </div>

        {/* FEES */}
        <div className="glass-card mt-8">

          <h2 className="text-2xl font-bold mb-6">

            Fees Configuration

          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <input
              type="number"
              placeholder="Course Fees"
              value={courseFees}
              onChange={(e) =>
                setCourseFees(
                  e.target.value
                )
              }
              className="input"
            />

            <input
              type="number"
              placeholder="Minimum Fees"
              value={minimumFees}
              onChange={(e) =>
                setMinimumFees(
                  e.target.value
                )
              }
              className="input"
            />

          </div>

        </div>

        {/* SAVE */}
        <button
          onClick={saveCourse}
          disabled={loading}
          className="save-btn mt-8"
        >

          {loading
            ? "Saving..."
            : "💾 Save Course"}

        </button>

      </div>

      <style jsx>{`

        .glass-card,
        .semester-card {
          background:
            rgba(255,255,255,0.06);

          backdrop-filter:
            blur(18px);

          border:
            1px solid rgba(255,255,255,0.08);

          border-radius: 24px;

          padding: 22px;

          box-shadow:
            0 8px 32px rgba(0,0,0,0.35);

          transition: 0.3s;
        }

        .active-card {
          border-color:
            rgba(249,115,22,0.4);

          box-shadow:
            0 0 35px rgba(249,115,22,0.15);
        }

        .subject-card {
          background:
            rgba(255,255,255,0.04);

          border:
            1px solid rgba(255,255,255,0.06);

          padding: 18px;

          border-radius: 18px;

          transition: 0.3s;
        }

        .subject-card:hover {
          transform:
            translateY(-3px);

          border-color:
            rgba(249,115,22,0.2);
        }

        .input {
          width: 100%;

          background:
            rgba(255,255,255,0.06);

          border:
            1px solid rgba(255,255,255,0.08);

          padding: 15px;

          border-radius: 16px;

          color: white;

          outline: none;

          transition: 0.3s;
        }

        .input:focus {
          border-color: #f97316;

          box-shadow:
            0 0 20px rgba(249,115,22,0.25);
        }

        .info-box {
          background:
            rgba(255,255,255,0.04);

          border:
            1px solid rgba(255,255,255,0.06);

          border-radius: 18px;

          padding: 18px;

          display: flex;

          flex-direction: column;

          gap: 10px;
        }

        .label {
          color: #9ca3af;

          font-size: 13px;
        }

        .value {
          font-size: 20px;

          font-weight: 700;
        }

        .orange {
          color: #fb923c;
        }

        .blue {
          color: #93c5fd;
        }

        .select-btn {
          background:
            rgba(255,255,255,0.08);

          border:
            1px solid rgba(255,255,255,0.08);

          padding: 14px 18px;

          border-radius: 16px;

          transition: 0.3s;

          font-weight: 700;
        }

        .selected-btn {
          background:
            linear-gradient(
              135deg,
              #f97316,
              #ec4899
            );

          color: white;

          box-shadow:
            0 0 30px rgba(249,115,22,0.3);
        }

        .save-btn {
          width: 100%;

          background:
            linear-gradient(
              135deg,
              #f97316,
              #ec4899
            );

          padding: 18px;

          border-radius: 18px;

          font-size: 18px;

          font-weight: 700;

          transition: 0.3s;

          box-shadow:
            0 0 35px rgba(249,115,22,0.35);
        }

        .save-btn:hover {
          transform:
            translateY(-3px);
        }

      `}</style>

    </div>
  );
}