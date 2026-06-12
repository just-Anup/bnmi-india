"use client";

import { useEffect, useState } from "react";

import {
  databases,
  account,
} from "@/lib/appwrite";

import { Query } from "appwrite";

import Link from "next/link";

const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function SemesterCourseListPage() {

  const [courses,
    setCourses] =
    
    useState([]);

  const [filteredCourses,
    setFilteredCourses] =
    useState([]);

  const [search,
    setSearch] =
    useState("");

  const [editCourse,
    setEditCourse] =
    useState(null);

  const [courseFees,
    setCourseFees] =
    useState("");

  const [minimumFees,
    setMinimumFees] =
    useState("");

  useEffect(() => {

    fetchCourses();

  }, []);

  // FETCH COURSES
  const fetchCourses = async () => {

    try {

      const user =
        await account.get();

      const res =
        await databases.listDocuments(
          DATABASE_ID,
          "franchise_semester_courses",
          [
            Query.equal(
              "franchiseEmail",
              user.email
            ),

            Query.orderDesc(
              "$createdAt"
            ),
          ]
        );

      setCourses(
        res.documents
      );

      setFilteredCourses(
        res.documents
      );

    } catch (error) {

      console.log(error);
    }
  };

  // SEARCH
  useEffect(() => {

    const filtered =
      courses.filter((course) =>

        course.courseName
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||

        course.courseCode
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          )
      );

    setFilteredCourses(
      filtered
    );

  }, [search, courses]);

  // DELETE COURSE
  const deleteCourse =
    async (id) => {

      try {

        const confirmDelete =
          confirm(
            "Delete this course?"
          );

        if (!confirmDelete)
          return;

        await databases.deleteDocument(
          DATABASE_ID,
          "franchise_semester_courses",
          id
        );

        fetchCourses();

      } catch (error) {

        console.log(error);

        alert(
          error.message
        );
      }
    };

  // OPEN EDIT
  const openEdit = (
    course
  ) => {

    setEditCourse(
      course
    );

    setCourseFees(
      course.courseFees
    );

    setMinimumFees(
      course.minimumFees
    );
  };

  // UPDATE FEES
  const updateFees =
    async () => {

      try {

        await databases.updateDocument(
          DATABASE_ID,
          "franchise_semester_courses",
          editCourse.$id,
          {
            courseFees:
              Number(
                courseFees
              ),

            minimumFees:
              Number(
                minimumFees
              ),
          }
        );

        alert(
          "Course Updated"
        );

        setEditCourse(
          null
        );

        fetchCourses();

      } catch (error) {

        console.log(error);

        alert(
          error.message
        );
      }
    };

  return (

    <div className="min-h-screen bg-[#07070a] text-white relative overflow-hidden p-3 sm:p-5 lg:p-10">

      {/* BG */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500/20 blur-[140px] rounded-full"></div>

      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500/20 blur-[140px] rounded-full"></div>

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

          <div>

            <h1 className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-orange-400 to-pink-500 text-transparent bg-clip-text">

              Semester Course List

            </h1>

            <p className="text-gray-400 mt-3">

              Manage semester courses

            </p>

          </div>

          <Link
            href="/login/institute/add-course/semester-course"
            className="add-btn"
          >

            + Add More Course

          </Link>

        </div>

        {/* SEARCH */}
        <div className="glass-card mb-6">

          <input
            type="text"
            placeholder="Search by course name or code..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="input"
          />

        </div>

        {/* TABLE */}
        <div className="glass-card overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1300px]">

              <thead>

                <tr className="table-head">

                  <th className="th">
                    Course Code
                  </th>

                  <th className="th">
                    Course Name
                  </th>

                  <th className="th">
                    Duration
                  </th>

                  <th className="th">
                    Selected Semester
                  </th>

                  <th className="th">
                    Course Fees
                  </th>

                  <th className="th">
                    Minimum Fees
                  </th>

                  <th className="th">
                    Status
                  </th>

                  <th className="th">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredCourses.map(
                  (course) => (

                    <tr
                      key={course.$id}
                      className="table-row"
                    >

                      <td className="td text-orange-400 font-bold">

                        {
                          course.courseCode
                        }

                      </td>

                      <td className="td min-w-[250px]">

                        {
                          course.courseName
                        }

                      </td>

                      <td className="td">

                        {
                          course.duration
                        }

                      </td>

                      <td className="td">

                        <div className="flex flex-wrap gap-2">

                          {course.selectedSemesters
                            ?.split("||")
                            .map(
                              (
                                sem,
                                index
                              ) => (

                                <span
                                  key={index}
                                  className="semester-badge"
                                >

                                  Sem {sem}

                                </span>
                              )
                            )}

                        </div>

                      </td>

                      <td className="td text-green-400 font-bold">

                        ₹
                        {
                          course.courseFees
                        }

                      </td>

                      <td className="td text-blue-400 font-bold">

                        ₹
                        {
                          course.minimumFees
                        }

                      </td>

                      <td className="td">

                        <span className="status-badge">

                          {
                            course.status
                          }

                        </span>

                      </td>

                      <td className="td">

                        <div className="flex flex-wrap gap-3">

                          {/* EDIT */}
                          <button
                            onClick={() =>
                              openEdit(
                                course
                              )
                            }
                            className="edit-btn"
                          >

                            Edit

                          </button>

                          {/* DELETE */}
                          <button
                            onClick={() =>
                              deleteCourse(
                                course.$id
                              )
                            }
                            className="delete-btn"
                          >

                            Delete

                          </button>

                          {/* MANAGE */}
                          <Link
                            href={`/login/institute/add-course/semester-course/${course.courseCode}`}
                            className="manage-btn"
                          >

                            Manage Subjects

                          </Link>

                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* EDIT MODAL */}
      {editCourse && (

        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">

          <div className="modal-card w-full max-w-lg">

            <h2 className="text-2xl font-bold mb-6">

              Edit Course Fees

            </h2>

            <div className="space-y-5">

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

            <div className="flex flex-col sm:flex-row gap-4 mt-8">

              <button
                onClick={() =>
                  setEditCourse(
                    null
                  )
                }
                className="close-btn flex-1"
              >

                Close

              </button>

              <button
                onClick={
                  updateFees
                }
                className="save-btn flex-1"
              >

                Save Changes

              </button>

            </div>

          </div>

        </div>
      )}

      <style jsx>{`

        .glass-card {
          background:
            rgba(255,255,255,0.06);

          backdrop-filter:
            blur(18px);

          border:
            1px solid rgba(255,255,255,0.08);

          border-radius: 24px;

          padding: 20px;

          box-shadow:
            0 8px 32px rgba(0,0,0,0.35);
        }

        .modal-card {
          background:
            rgba(17,17,17,0.95);

          backdrop-filter:
            blur(20px);

          border:
            1px solid rgba(255,255,255,0.08);

          border-radius: 24px;

          padding: 24px;
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
        }

        .input:focus {
          border-color:
            #f97316;

          box-shadow:
            0 0 20px rgba(249,115,22,0.25);
        }

        .table-head {
          background:
            rgba(249,115,22,0.12);
        }

        .th {
          padding: 18px;

          text-align: left;

          color: #fdba74;

          font-size: 14px;

          font-weight: 700;

          white-space: nowrap;
        }

        .td {
          padding: 18px;

          border-bottom:
            1px solid rgba(255,255,255,0.06);

          white-space: nowrap;
        }

        .table-row:hover {
          background:
            rgba(255,255,255,0.04);
        }

        .semester-badge {
          background:
            rgba(59,130,246,0.15);

          border:
            1px solid rgba(59,130,246,0.2);

          color: #93c5fd;

          padding: 8px 12px;

          border-radius: 12px;

          font-size: 13px;

          font-weight: 700;
        }

        .status-badge {
          background:
            rgba(34,197,94,0.15);

          border:
            1px solid rgba(34,197,94,0.2);

          color: #86efac;

          padding: 8px 14px;

          border-radius: 12px;

          font-size: 13px;

          font-weight: 700;
        }

        .edit-btn,
        .delete-btn,
        .manage-btn,
        .close-btn,
        .save-btn,
        .add-btn {
          transition: 0.3s;

          font-weight: 700;
        }

        .edit-btn {
          background:
            rgba(59,130,246,0.15);

          border:
            1px solid rgba(59,130,246,0.2);

          color: #93c5fd;

          padding: 10px 16px;

          border-radius: 14px;
        }

        .delete-btn {
          background:
            rgba(239,68,68,0.15);

          border:
            1px solid rgba(239,68,68,0.2);

          color: #fca5a5;

          padding: 10px 16px;

          border-radius: 14px;
        }

        .manage-btn,
        .save-btn,
        .add-btn {
          background:
            linear-gradient(
              135deg,
              #f97316,
              #ec4899
            );

          color: white;

          border-radius: 14px;
        }

        .manage-btn {
          padding: 10px 18px;
        }

        .save-btn {
          padding: 14px;
        }

        .add-btn {
          padding: 14px 20px;
        }

        .close-btn {
          background:
            rgba(255,255,255,0.08);

          border:
            1px solid rgba(255,255,255,0.08);

          padding: 14px;

          border-radius: 14px;
        }

      `}</style>

    </div>
  );
}