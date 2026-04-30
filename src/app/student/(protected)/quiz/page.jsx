"use client";

import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";
import { useRouter } from "next/navigation";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = "questions";

export default function QuizPage() {
  const router = useRouter();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [course, setCourse] = useState("");

  useEffect(() => {
    const student = JSON.parse(localStorage.getItem("student"));

    if (!student) {
      router.push("student/login");
      return;
    }

    const courseName = student.courseName?.toLowerCase().trim();
    setCourse(courseName);

    fetchQuestions(courseName);
  }, []);

  const fetchQuestions = async (courseName) => {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID
    );

    const filtered = res.documents.filter(
      (q) =>
        q.courseName?.toLowerCase().trim() === courseName
    );

    setQuestions(filtered);
  };

  const handleSelect = (qId, option) => {
    if (submitted) return;

    setAnswers({
      ...answers,
      [qId]: option,
    });
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const getScore = () => {
    let score = 0;

    questions.forEach((q) => {
      if (answers[q.$id] === q.correctAnswer) {
        score++;
      }
    });

    return score;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* HEADER */}
      <div className="bg-white p-5 rounded-2xl shadow mb-6">
        <h1 className="text-xl font-bold">
          Course: {course}
        </h1>

        {/* PROGRESS BAR */}
        {!submitted && (
          <div className="mt-4 w-full bg-gray-200 h-3 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all"
              style={{
                width: `${
                  (Object.keys(answers).length / questions.length) * 100
                }%`,
              }}
            ></div>
          </div>
        )}
      </div>

      {/* QUESTIONS */}
      {questions.length === 0 ? (
        <p className="text-center text-gray-500">
          No Questions Found
        </p>
      ) : (
        <>
          {questions.map((q, index) => (
            <div
              key={q.$id}
              className="bg-white p-6 mb-6 rounded-2xl shadow"
            >
              <h2 className="font-semibold mb-4">
                {index + 1}. {q.question}
              </h2>

              <div className="space-y-3">
                {[q.option1, q.option2, q.option3, q.option4].map(
                  (opt, i) => {
                    const isSelected = answers[q.$id] === opt;
                    const isCorrect = opt === q.correctAnswer;

                    return (
                      <div
                        key={i}
                        onClick={() => handleSelect(q.$id, opt)}
                        className={`p-3 rounded-lg border cursor-pointer transition
                          ${
                            submitted
                              ? isCorrect
                                ? "bg-green-100 border-green-500"
                                : isSelected
                                ? "bg-red-100 border-red-500"
                                : "bg-white"
                              : isSelected
                              ? "bg-blue-100 border-blue-500"
                              : "hover:bg-gray-100"
                          }
                        `}
                      >
                        {opt}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          ))}

          {/* BUTTON / RESULT */}
          {!submitted ? (
            <button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl shadow"
            >
              Submit Answers
            </button>
          ) : (
            <div className="bg-white p-6 rounded-2xl shadow text-center mt-6">
              <h2 className="text-2xl font-bold mb-2">
                Your Score
              </h2>
              <p className="text-xl">
                {getScore()} / {questions.length}
              </p>

              <button
                onClick={() => router.push("student/login")}
                className="mt-4 bg-green-600 text-white px-6 py-2 rounded-xl"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}