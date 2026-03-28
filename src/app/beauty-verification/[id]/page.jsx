"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { databases } from "@/lib/appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export default function VerifyCertificate() {

  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {

    const fetchData = async () => {
      try {

        console.log("VERIFY ID:", id); // 🔥 DEBUG

        const res = await databases.getDocument(
          DATABASE_ID,
          "certificates",
          id
        );

        console.log("DATA FOUND:", res); // 🔥 DEBUG

        setData(res);

      } catch (err) {

        console.error("FETCH ERROR:", err);

        setError("Invalid or Not Found");

      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();

  }, [id]);

  // ✅ LOADING
  if (loading) {
    return <div className="p-10">Loading...</div>;
  }

  // ❌ ERROR
  if (error) {
    return (
      <div className="p-10 text-red-600 font-bold">
        ❌ {error}
      </div>
    );
  }

  // ❌ SAFETY
  if (!data) {
    return (
      <div className="p-10 text-red-600 font-bold">
        ❌ No Data Found
      </div>
    );
  }

  return (

    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-md mx-auto bg-white rounded-xl shadow p-5">

        {/* PHOTO */}
        <img
          src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/6986e8a4001925504f6b/files/${data.photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
          className="w-40 h-40 mx-auto rounded-lg object-cover"
        />

        {/* NAME */}
        <h2 className="text-red-600 text-lg font-bold mt-4 text-center">
          Name Of Student :
        </h2>

        <p className="text-center font-semibold">
          {data.studentName}
        </p>

        {/* COURSE */}
        <div className="mt-5">
          <h3 className="bg-black text-white px-4 py-2 rounded-full inline-block">
            Course Name
          </h3>

          <p className="mt-2">
            • {data.course}
          </p>
        </div>

        {/* DETAILS */}
        <div className="mt-5">
          <h3 className="bg-black text-white px-4 py-2 rounded-full inline-block">
            Course Details
          </h3>

          <ul className="mt-2 space-y-2 text-sm">

            <li>• Certificate Number : {data.certificateId}</li>
            <li>• Course Duration : {data.duration}</li>
            <li>• Certificate Issue : {new Date(data.issueDate).toLocaleDateString()}</li>

            <li>• Marks Obtained : {data.marks}</li>
            <li>• Grade Secured : {data.grade}</li>

          </ul>
        </div>

        {/* INSTITUTE */}
        <div className="mt-5">
          <h3 className="bg-red-600 text-white px-4 py-2 rounded-full inline-block">
            Authorized Center Details
          </h3>

          <ul className="mt-2 text-sm space-y-2">
            <li>• Name Of Institute : {data.instituteName}</li>
            <li>• Address : {data.address}, {data.city}</li>
          </ul>
        </div>

      </div>

    </div>
  );
}