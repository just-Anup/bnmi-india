"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useRouter } from "next/navigation";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = "student_admissions";
const BUCKET_ID = "6986e8a4001925504f6b";

export default function AdmissionList() {

  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(0);
const LIMIT = 10;
const [hasMore, setHasMore] = useState(false);
  const router = useRouter();


useEffect(() => {
  fetchStudents();
}, [page]);

  const fetchStudents = async () => {

    const user = await account.get();

  const res = await databases.listDocuments(
  DATABASE_ID,
  COLLECTION_ID,
  [
    Query.equal("createdById", user.$id),
    Query.orderDesc("createdAt"),
    Query.limit(LIMIT),
    Query.offset(page * LIMIT)
  ]
);

setHasMore(res.documents.length === LIMIT);
    setStudents(res.documents);



  };
  const loadSemesterCourseNames = async (students) => {
    const ids = [...new Set(
      students
        .filter(s => s.courseType === "semester" && s.courseName?.length > 20)
        .map(s => s.courseName)
    )];

    const map = {};

    for (const id of ids) {
      try {
        const course = await databases.getDocument(
          DATABASE_ID,
          "semester_courses",
          id
        );
        map[id] = course.courseName;
      } catch {
        map[id] = "Unknown";
      }
    }

    setCourseMap(map);
  };

  return (

    <div className="p-10">

      <div className="flex justify-between mb-6">

        <h1 className="text-2xl font-bold">
          LIST STUDENT ADMISSION
        </h1>

        <button
          onClick={() => router.push("/login/institute/manage-student/admission/add")}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          ADD NEW STUDENT
        </button>

      </div>

      <table className="w-full border">

        <thead className="bg-yellow-200">

          <tr>

            <th className="border p-2">S/N</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Photo</th>
            <th className="border p-2">Batch</th>
            <th className="border p-2">Student Name</th>
            <th className="border p-2">Course</th>
         <th className="border p-2">Mobile</th>
<th className="border p-2">Username</th>
<th className="border p-2">Password</th>
<th className="border p-2">Action</th>

          </tr>

        </thead>

        <tbody>

          {students.length === 0 ? (

            <tr>
              <td colSpan="10" className="text-center p-4">
                No Data Found
              </td>
            </tr>

          ) : (

            students.map((item, index) => (

              <tr key={item.$id}>

               <td className="border p-2">
  {page * LIMIT + index + 1}
</td>

                <td className="border p-2">
                  {item.status}
                </td>

                <td className="border p-2">

                  {item.photoId ? (

           <img
  src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${item.photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
  loading="lazy"
  decoding="async"
  width={40}
  height={40}
  className="w-10 h-10 rounded object-cover"
  alt={item.studentName}
/>

                  ) : "No Photo"}

                </td>

                <td className="border p-2">
                  {item.batch}
                </td>

                <td className="border p-2">
                  {item.studentName}
                </td>

              
                <td className="border p-2">
  {item.courseName}

                </td>

                <td className="border p-2">
                  {item.mobile}
                </td>
                <td className="border p-2">
  {item.username || "-"}
</td>

<td className="border p-2">
  {item.password || "-"}
</td>

                <td className="border p-2 space-x-2">

                  <button
                    onClick={() => router.push(`/login/institute/manage-student/admission/edit/${item.$id}`)}
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => router.push(`/login/institute/manage-student/admission/form/${item.$id}`)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                  >
                    Admission Form
                  </button>

                  <button
                    onClick={() => router.push(`/login/institute/manage-student/admission/idcard/${item.$id}`)}
                    className="bg-green-600 text-white px-2 py-1 rounded"
                  >
                    ID Card
                  </button>

                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>
      <div className="flex justify-between mt-6">

  <button
    disabled={page === 0}
    onClick={() => setPage(page - 1)}
    className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
  >
    Previous
  </button>

  <span className="font-semibold">
    Page {page + 1}
  </span>

  <button
    disabled={!hasMore}
    onClick={() => setPage(page + 1)}
    className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
  >
    Next
  </button>

</div>

    </div>

  );

}