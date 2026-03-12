"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useRouter } from "next/navigation";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = "student_enquiries";

export default function ManageStudent() {

  const [enquiries, setEnquiries] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {

    const user = await account.get();

    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal("createdById", user.$id),
        Query.orderDesc("$createdAt")
      ]
    );

    setEnquiries(res.documents);

  };


  const deleteEnquiry = async (id) => {

    if (!confirm("Are you sure you want to delete this enquiry?")) return;

    try {

      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_ID,
        id
      );

      alert("Enquiry deleted successfully");

      fetchEnquiries(); // reload list

    } catch (err) {

      console.log("Delete error:", err);
      alert("Error deleting enquiry");

    }

  };

  const editEnquiry = (id) => {
    router.push(`/login/institute/manage-student/enquiry/add?id=${id}`);
  };

  return (

    <div className="p-10">

      <div className="flex justify-between mb-6">

        <h1 className="text-2xl font-bold">
          LIST STUDENT ENQUIRIES
        </h1>

        <button
          onClick={() => router.push("/login/institute/manage-student/enquiry/add")}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          NEW STUDENT ENQUIRY
        </button>

      </div>

      <table className="w-full border">

        <thead className="bg-yellow-200">

          <tr>
            <th className="border p-2">S/N</th>
            <th className="border p-2">Student Name</th>
            <th className="border p-2">Course</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Mobile</th>
            <th className="border p-2">Date</th>
            <th className="border p-2">Action</th>
          </tr>

        </thead>

        <tbody>

          {enquiries.length === 0 ? (

            <tr>
              <td colSpan="7" className="text-center p-4">
                No data available
              </td>
            </tr>

          ) : (

            enquiries.map((item, index) => (
              <tr key={item.$id}>

                <td className="border p-2">{index + 1}</td>

                <td className="border p-2">
                  {item.studentName}
                </td>

                <td className="border p-2">
                  {item.courseInterested}
                </td>

                <td className="border p-2">
                  {item.email}
                </td>

                <td className="border p-2">
                  {item.mobile}
                </td>

                <td className="border p-2">
                  {item.enquiryDate}
                </td>

                <td className="border p-2 flex gap-2">

                  <button
                    onClick={() => editEnquiry(item.$id)}
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteEnquiry(item.$id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>

                  <button
                    onClick={() =>
                      router.push(`/login/institute/manage-student/admission/add?id=${item.$id}`)
                    }
                    className="bg-yellow-400 px-2 py-1 rounded"
                  >
                    Register Now
                  </button>

                </td>
              </tr>
            ))

          )}

        </tbody>

      </table>

    </div>

  );

}