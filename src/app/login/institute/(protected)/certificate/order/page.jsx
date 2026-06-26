"use client";

import { useEffect, useMemo, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { Query, ID } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

const RESULT_COLLECTION = "exam_results";
const ORDER_COLLECTION = "certificate_orders";

const BUCKET_ID = "6986e8a4001925504f6b";

export default function OrderPage() {

  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [search, setSearch] = useState("");

  const [user, setUser] = useState(null);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {

  try {

    setLoading(true);

    const currentUser = await account.get();
    setUser(currentUser);

    // Load all passed results of this franchise
    const resultRes = await databases.listDocuments(
      DATABASE_ID,
      RESULT_COLLECTION,
      [
        Query.equal("createdById", currentUser.$id),
        Query.orderDesc("$createdAt"),
        Query.limit(500)
      ]
    );

    // Load existing orders
    const orderRes = await databases.listDocuments(
      DATABASE_ID,
      ORDER_COLLECTION,
      [
        Query.equal("createdById", currentUser.$id),
        Query.limit(500)
      ]
    );

    // Create array of already ordered student IDs
    const orderedStudents = [];

    orderRes.documents.forEach(order => {

      if (Array.isArray(order.studentIds)) {

        order.studentIds.forEach(id => {

          if (!orderedStudents.includes(id)) {
            orderedStudents.push(id);
          }

        });

      }

    });

    // Only passed students
    const passedStudents = resultRes.documents
      .filter(result => result.grade !== "F")
      .map(result => ({
        ...result,
        alreadyOrdered:
          orderedStudents.includes(result.studentId) ||
          result.certificateOrdered === true
      }));

    setResults(passedStudents);

  } catch (error) {

    console.log("Load Results Error:", error);

  } finally {

    setLoading(false);

  }

};

// SEARCH RESULTS
const filteredResults = useMemo(() => {

  return results.filter(student => {

    const keyword = search.toLowerCase();

    return (
      student.studentName?.toLowerCase().includes(keyword) ||
      student.studentId?.toLowerCase().includes(keyword) ||
      student.course?.toLowerCase().includes(keyword) ||
      student.instituteName?.toLowerCase().includes(keyword)
    );

  });

}, [results, search]);

// SELECT / UNSELECT STUDENT
const toggleSelect = (id) => {

  const student = results.find(item => item.$id === id);

  if (!student) return;

  // Already Ordered
  if (student.alreadyOrdered) return;

  // Remove if already selected
  if (selected.includes(id)) {

    setSelected(prev => prev.filter(item => item !== id));

    return;
  }

  // Maximum 10
  if (selected.length >= 10) {

    alert("Maximum 10 students can be selected in one order.");

    return;
  }

  setSelected(prev => [...prev, id]);

};

// SELECT ALL (MAX 10)
const selectAll = () => {

  const available = filteredResults
    .filter(item => !item.alreadyOrdered)
    .slice(0, 10)
    .map(item => item.$id);

  setSelected(available);

};

// CLEAR ALL
const clearSelection = () => {

  setSelected([]);

};

const createOrder = async () => {

  if (selected.length === 0) {
    alert("Please select at least one student.");
    return;
  }

  try {

    setOrdering(true);

    // Selected Students
    const students = results.filter(item =>
      selected.includes(item.$id)
    );

    // Create Order Number
    const orderNo =
      "BNMI-ORD-" +
      Date.now().toString().slice(-8);

    // Arrays
    const studentIds = [];
    const studentNames = [];
    const resultIds = [];
    const courseNames = [];
    const grades = [];
    const photoIds = [];
    const examDates = [];

    students.forEach(student => {

      studentIds.push(student.studentId);
      studentNames.push(student.studentName);
      resultIds.push(student.$id);
      courseNames.push(student.course);
      grades.push(student.grade);
      photoIds.push(student.photoId || "");
      examDates.push(student.examDate || "");

    });

    // Create Order
    await databases.createDocument(
      DATABASE_ID,
      ORDER_COLLECTION,
      ID.unique(),
      {
        orderNo,
        franchiseId: students[0].franchiseId || "",
        franchiseEmail: user.email,
        instituteName: students[0].instituteName || "",
        createdById: user.$id,

        studentIds,
        studentNames,
        resultIds,
        courseNames,
        grades,
        photoIds,
        examDates,

        totalStudents: students.length,
        status: "Pending",
        createdAt: new Date().toISOString()
      }
    );

    // Update Exam Results
    for (const student of students) {

      try {

        await databases.updateDocument(
          DATABASE_ID,
          RESULT_COLLECTION,
          student.$id,
          {
            certificateOrdered: true
          }
        );

      } catch (err) {

        console.log(
          "Update Result Error:",
          err
        );

      }

    }

    alert("Certificate Order Created Successfully");

    setSelected([]);

    loadResults();

  } catch (error) {

    console.log(error);

    alert(
      error.message ||
      "Failed to create order."
    );

  } finally {

    setOrdering(false);

  }

};

const orderButtonClass = ordering
  ? "bg-gray-500 cursor-not-allowed text-white"
  : selected.length === 0
  ? "bg-gray-400 cursor-not-allowed text-white"
  : "bg-indigo-600 hover:bg-indigo-700 text-white";

return (

  <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 p-4 md:p-8">

    {/* HEADER */}
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

      <div>

        <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
          Certificate Orders
        </h1>

        <p className="text-gray-500 mt-2">
          Select up to 10 passed students and place one certificate order.
        </p>

      </div>

      <div className="flex flex-wrap gap-3">

        <button
          onClick={selectAll}
          className="px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition"
        >
          Select First 10
        </button>

        <button
          onClick={clearSelection}
          className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition"
        >
          Clear Selection
        </button>

        <button
          onClick={createOrder}
          disabled={ordering || selected.length === 0}
          className={`px-6 py-3 rounded-xl font-bold shadow-lg transition ${orderButtonClass}`}
        >
          {ordering ? "Creating Order..." : `Order Certificate (${selected.length})`}
        </button>

      </div>

    </div>

    {/* SEARCH */}
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 mb-6">

      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">

        <input
          type="text"
          placeholder="Search by Student Name, Student ID, Course or Institute..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-[500px] border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-indigo-500"
        />

        <div className="flex gap-3">

          <div className="bg-indigo-100 text-indigo-700 px-5 py-3 rounded-xl font-semibold">

            Total :
            <span className="ml-2">
              {filteredResults.length}
            </span>

          </div>

          <div className="bg-green-100 text-green-700 px-5 py-3 rounded-xl font-semibold">

            Selected :
            <span className="ml-2">
              {selected.length}/10
            </span>

          </div>

        </div>

      </div>

        {/* TABLE */}
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">

      <div className="overflow-x-auto">

        <table className="min-w-[1200px] w-full">

          <thead className="bg-gradient-to-r from-yellow-400 to-yellow-300 text-gray-800">

            <tr>

              <th className="p-4 text-left">
                Select
              </th>

              <th className="p-4 text-left">
                #
              </th>

              <th className="p-4 text-left">
                Photo
              </th>

              <th className="p-4 text-left">
                Student Name
              </th>

              <th className="p-4 text-left">
                Student ID
              </th>

              <th className="p-4 text-left">
                Course
              </th>

              <th className="p-4 text-left">
                Grade
              </th>

              <th className="p-4 text-left">
                Exam Date
              </th>

              <th className="p-4 text-left">
                Status
              </th>

            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>

                <td
                  colSpan={9}
                  className="text-center p-10 text-gray-500"
                >
                  Loading Students...
                </td>

              </tr>

            ) : filteredResults.length === 0 ? (

              <tr>

                <td
                  colSpan={9}
                  className="text-center p-10 text-gray-500"
                >
                  No Passed Students Found
                </td>

              </tr>

            ) : (

              filteredResults.map((student, index) => {

                const photoUrl = student.photoId
                  ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
                  : null;

                return (

                  <tr
                    key={student.$id}
                    className="border-b hover:bg-slate-50 transition"
                  >

                    {/* CHECKBOX */}

                    <td className="p-4">

                      {student.alreadyOrdered ? (

                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                          Ordered
                        </span>

                      ) : (

                        <input
                          type="checkbox"
                          checked={selected.includes(student.$id)}
                          onChange={() =>
                            toggleSelect(student.$id)
                          }
                          className="w-5 h-5 accent-indigo-600 cursor-pointer"
                        />

                      )}

                    </td>

                    {/* SERIAL */}

                    <td className="p-4 font-semibold">
                      {index + 1}
                    </td>

                    {/* PHOTO */}

                    <td className="p-4">

                      {photoUrl ? (

                        <img
                          src={photoUrl}
                          alt=""
                          className="w-14 h-14 rounded-full object-cover border-2 border-indigo-200"
                        />

                      ) : (

                        <div className="w-14 h-14 rounded-full bg-gray-300"></div>

                      )}

                    </td>

                    {/* NAME */}

                    <td className="p-4 font-semibold text-gray-700 whitespace-nowrap">

                      {student.studentName}

                    </td>

                    {/* STUDENT ID */}

                    <td className="p-4 whitespace-nowrap">

                      {student.studentId}

                    </td>

                    {/* COURSE */}

                    <td className="p-4 whitespace-nowrap">

                      {student.course}

                    </td>

                    {/* GRADE */}

                    <td className="p-4">

                      <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-semibold">

                        {student.grade}

                      </span>

                    </td>

                    {/* EXAM DATE */}

                    <td className="p-4 whitespace-nowrap">

                      {student.examDate || "-"}

                    </td>

                    {/* STATUS */}

                    <td className="p-4">

                      {student.alreadyOrdered ? (

                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">

                          Already Ordered

                        </span>

                      ) : (

                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">

                          Ready

                        </span>

                      )}

                    </td>

                  </tr>

                );

              })

            )}

          </tbody>

        </table>

      </div>
    </div>

  </div>
</div>
  
  );
}
