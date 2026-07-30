"use client";

import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";
import {
  ID,
  Query
} from "appwrite";
import { useRouter } from "next/navigation";

const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

const QUESTION_COLLECTION =
  "online_exam_questions";

const RESULT_COLLECTION =
  "online_exam_results";

const FINAL_RESULT_COLLECTION =
  "exam_results";

const SUBJECT_RESULT_COLLECTION =
  "student_subject_results";

export default function StartExamPage() {

  const router = useRouter();

  const [student, setStudent] =
    useState(null);

  const [questions, setQuestions] =
    useState([]);

  const [answers, setAnswers] =
    useState({});

  const [loading, setLoading] =
    useState(true);

  const [submitted, setSubmitted] =
    useState(false);

  // ✅ 1 HOUR TIMER
  const [timeLeft, setTimeLeft] =
    useState(3600);

  // ✅ TRACK WARNING
  const [warningCount, setWarningCount] =
    useState(0);

  // =========================
  // LOAD EXAM
  // =========================
  useEffect(() => {

    loadExam();

  }, []);

  // =========================
  // TIMER
  // =========================
  useEffect(() => {

    if (
      submitted ||
      loading ||
      questions.length === 0
    ) return;

    const timer = setInterval(() => {

      setTimeLeft((prev) => {

        if (prev <= 1) {

          clearInterval(timer);

          handleSubmit(true);

          return 0;
        }

        return prev - 1;

      });

    }, 1000);

    return () => clearInterval(timer);

  }, [submitted, loading, questions]);

  // =========================
  // REFRESH WARNING
  // =========================
  useEffect(() => {

    const handleBeforeUnload = async (e) => {

      e.preventDefault();

      e.returnValue =
        "Refreshing or leaving this page will submit your exam automatically.";

      const newCount =
        warningCount + 1;

      setWarningCount(newCount);

      // ✅ SECOND ATTEMPT AUTO SUBMIT
      if (newCount >= 2) {

        await handleSubmit(true);

      }

    };

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    return () => {

      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );

    };

  }, [warningCount]);

  // =========================
  // BACK BUTTON DETECTION
  // =========================
  useEffect(() => {

    const handlePopState = async () => {

      const confirmLeave =
        window.confirm(
          "If you go back, your exam will be submitted automatically. Do you want to continue?"
        );

      if (confirmLeave) {

        await handleSubmit(true);

      } else {

        window.history.pushState(
          null,
          "",
          window.location.href
        );

      }

    };

    window.history.pushState(
      null,
      "",
      window.location.href
    );

    window.addEventListener(
      "popstate",
      handlePopState
    );

    return () => {

      window.removeEventListener(
        "popstate",
        handlePopState
      );

    };

  }, []);

  // =========================
  // LOAD QUESTIONS
  // =========================
  const loadExam = async () => {

    try {

      const localStudent =
        JSON.parse(
          localStorage.getItem("student")
        );

      if (!localStudent) {

        router.push("/student/login");
        return;

      }

      setStudent(localStudent);

      // ✅ NORMALIZE COURSE
      const normalizedCourse =
        localStudent.courseName
          ?.toLowerCase()
          .trim();

      console.log(
        "NORMALIZED COURSE:",
        normalizedCourse
      );

      // ✅ FETCH QUESTIONS
      const res =
        await databases.listDocuments(
          DATABASE_ID,
          QUESTION_COLLECTION,
          [
            Query.equal(
              "courseName",
              normalizedCourse
            )
          ]
        );

      console.log(
        "FOUND QUESTIONS:",
        res.documents
      );

      setQuestions(res.documents);

    } catch (err) {

      console.log(err);

    }

    setLoading(false);
  };

  // =========================
  // SELECT ANSWER
  // =========================
  const selectAnswer = (
    questionId,
    option
  ) => {

    if (submitted) return;

    setAnswers({
      ...answers,
      [questionId]: option
    });

  };

  // =========================
  // SCORE
  // =========================
  const calculateScore = () => {

    let score = 0;

    questions.forEach((q) => {

      if (
        answers[q.$id] ===
        q.correctAnswer
      ) {
        score++;
      }

    });

    return score;
  };

  // =========================
  // PERCENTAGE
  // =========================
  const calculatePercentage = () => {

    if (questions.length === 0)
      return 0;

    return Math.round(
      (calculateScore() /
        questions.length) *
        100
    );
  };

  // =========================
  // GRADE
  // =========================
  const calculateGrade = () => {

    const percentage =
      calculatePercentage();

    if (percentage >= 80)
      return "A";

    if (percentage >= 60)
      return "B";

    if (percentage >= 40)
      return "C";

    return "F";
  };

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async (
    autoSubmit = false
  ) => {

    try {

      // ✅ STOP MULTIPLE SUBMIT
      if (submitted) return;

      setSubmitted(true);

      // ✅ CHECK AGAIN
      const admissionCheck =
        await databases.getDocument(
          DATABASE_ID,
          "student_admissions",
          student.$id
        );

      if (
        admissionCheck.examSubmitted
      ) {

        alert(
          "Exam Already Submitted"
        );

        router.push(
          "/student/exam"
        );

        return;
      }

      const score =
        calculateScore();

      const percentage =
        calculatePercentage();

      const grade =
        calculateGrade();

      // =====================
      // SAVE ONLINE RESULT
      // =====================
      await databases.createDocument(
        DATABASE_ID,
        RESULT_COLLECTION,
        ID.unique(),
        {
          studentId: student.$id,

          studentName:
            student.studentName,

          courseName:
            student.courseName,

          subject:
            student.subjects || "",

          semester:
            Number(
              student.semester || 0
            ),

          totalQuestions:
            questions.length,

          correctAnswers:
            score,

          percentage,

          grade,

          examType:
            "online",

          submittedAt:
            new Date().toISOString(),
        }
      );

      // =====================
      // SAVE FINAL RESULT
      // =====================
      await databases.createDocument(
        DATABASE_ID,
        FINAL_RESULT_COLLECTION,
        ID.unique(),
        {
          studentId: student.$id,

          studentName:
            student.studentName || "",

          course:
            student.courseName || "",

          photoId:
            student.photoId || "",

          subjects:
            student.subjects || "",

          semesterNumber:
            Number(
              student.semester || 0
            ),

          courseCode:
            student.courseCode || "",

          courseType:
            student.courseType || "",

          marksArray:
            JSON.stringify(
              questions.map((q) => ({
                subject:
                  q.subject,

                objective:
                  answers[q.$id] ===
                  q.correctAnswer
                    ? 1
                    : 0,

                practical: 0,

                total:
                  answers[q.$id] ===
                  q.correctAnswer
                    ? 1
                    : 0
              }))
            ),

          totalMarks: score,

          percentage,

          grade,

          franchiseId:
            student.franchiseId || "",

          instituteName:
            student.instituteName || "",

          createdById:
            student.createdById || "",

          createdAt:
            new Date().toISOString()
        }
      );

      // =====================
      // SUBJECT RESULT
      // =====================
      await databases.createDocument(
        DATABASE_ID,
        SUBJECT_RESULT_COLLECTION,
        ID.unique(),
        {
          studentId: student.$id,

          subject:
            student.subjects || "",

          objective: score,

          practical: 0,

          total: score,

          courseType:
            student.courseType || "",

          createdAt:
            new Date().toISOString()
        }
      );

      // =====================
      // LOCK EXAM
      // =====================
      await databases.updateDocument(
        DATABASE_ID,
        "student_admissions",
        student.$id,
        {
          examSubmitted: true
        }
      );

      alert(
        autoSubmit
          ? "Exam Submitted Automatically"
          : "Exam Submitted Successfully"
      );

      router.push("/student/exam");

    } catch (err) {

     console.error("Submit Error:", err);
console.log(err.message);
console.log(err.code);

alert(err.message || "Failed To Submit Exam");

      setSubmitted(false);

    }
  };

  // =========================
  // FORMAT TIMER
  // =========================
  const formatTime = (seconds) => {

    const hrs = Math.floor(
      seconds / 3600
    );

    const mins = Math.floor(
      (seconds % 3600) / 60
    );

    const secs =
      seconds % 60;

    return `${hrs
      .toString()
      .padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;

  };

  // =========================
  // LOADING
  // =========================
  if (loading) {

    return (

      <div className="min-h-screen bg-black text-white flex items-center justify-center">

        Loading Exam...

      </div>

    );
  }

  return (

    <div className="min-h-screen bg-black text-white p-6">

      {/* HEADER */}
      <div className="bg-[#121212] border border-gray-800 rounded-3xl p-6 mb-8 flex flex-col md:flex-row justify-between items-center">

        <div>

          <h1 className="text-3xl font-bold text-orange-500 mb-2">

            Online Examination

          </h1>

          <p className="text-gray-400">

            {student?.courseName}

          </p>

        </div>

        {/* TIMER */}
        <div className="mt-5 md:mt-0">

          <div className="bg-red-500 text-white px-6 py-3 rounded-2xl text-2xl font-bold shadow-lg">

            ⏰ {formatTime(timeLeft)}

          </div>

        </div>

      </div>

      {/* NO QUESTIONS */}
      {questions.length === 0 && (

        <div className="bg-[#121212] border border-red-500 rounded-3xl p-10 text-center">

          <h2 className="text-3xl font-bold text-red-400 mb-4">

            No Questions Found

          </h2>

          <p className="text-gray-400">

            Questions are not uploaded for this course yet.

          </p>

        </div>

      )}

      {/* QUESTIONS */}
      {questions.length > 0 && (

        <>
          {/* PROGRESS */}
          <div className="bg-[#121212] border border-gray-800 rounded-2xl p-4 mb-8">

            <div className="flex justify-between mb-2">

              <span>
                Progress
              </span>

              <span>
                {
                  Object.keys(answers)
                    .length
                }
                /{questions.length}
              </span>

            </div>

            <div className="w-full h-4 bg-black rounded-full overflow-hidden">

              <div
                className="h-full bg-orange-500 transition-all duration-300"
                style={{
                  width: `${
                    (Object.keys(answers)
                      .length /
                      questions.length) *
                    100
                  }%`
                }}
              ></div>

            </div>

          </div>

          {/* QUESTIONS */}
          <div className="space-y-8">

            {questions.map(
              (q, index) => {

                const selected =
                  answers[q.$id];

                return (

                  <div
                    key={q.$id}
                    className="bg-[#121212] border border-gray-800 rounded-3xl p-6 shadow-xl"
                  >

                    <h2 className="text-xl font-semibold mb-6">

                      {index + 1}.
                      {" "}
                      {q.question}

                    </h2>

                    <div className="grid grid-cols-1 gap-4">

                      {[
                        q.option1,
                        q.option2,
                        q.option3,
                        q.option4
                      ].map(
                        (
                          option,
                          optionIndex
                        ) => (

                          <button
                            key={optionIndex}
                            onClick={() =>
                              selectAnswer(
                                q.$id,
                                option
                              )
                            }
                            className={`text-left p-4 rounded-2xl border transition-all duration-300 ${
                              selected ===
                              option
                                ? "bg-orange-500 border-orange-500 text-black font-semibold"
                                : "bg-black border-gray-700 hover:border-orange-500"
                            }`}
                          >

                            {option}

                          </button>

                        )
                      )}

                    </div>

                  </div>

                );
              }
            )}

          </div>

          {/* SUBMIT */}
          {!submitted && (

            <div className="mt-10 text-center">

              <button
                onClick={() =>
                  handleSubmit(false)
                }
                className="bg-green-500 hover:bg-green-600 transition-all duration-300 text-white font-bold px-10 py-4 rounded-2xl shadow-2xl text-lg"
              >

                Submit Exam

              </button>

            </div>

          )}

        </>

      )}

    </div>

  );
}