"use client";

import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const CERT_COLLECTION = "certificates";

const BUCKET_ID = "6986e8a4001925504f6b";

export default function CertificateApprovalPage() {

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {

      const res = await databases.listDocuments(
        DATABASE_ID,
        CERT_COLLECTION
      );

      setCertificates(res.documents);

    } catch (err) {
      console.log("Load certificates error:", err);
    } finally {
      setLoading(false);
    }
  };

  const approveCertificate = async (id) => {
    try {

      await databases.updateDocument(
        DATABASE_ID,
        CERT_COLLECTION,
        id,
        { status: "approved" }
      );

      alert("Certificate Approved");

      loadCertificates();

    } catch (err) {
      console.log(err);
    }
  };

  const rejectCertificate = async (id) => {
    try {

      await databases.updateDocument(
        DATABASE_ID,
        CERT_COLLECTION,
        id,
        { status: "rejected" }
      );

      alert("Certificate Rejected");

      loadCertificates();

    } catch (err) {
      console.log(err);
    }
  };

const printCertificate = (cert) => {

  const data = {
    studentName: cert.studentName,
    marks: cert.marks,
    grade: cert.grade,
    franchiseName: cert.franchiseName || "BNMI Franchise",
    signatureId: cert.signatureId || "",
    photoId: cert.photoId || ""
  };

  localStorage.setItem(
    "certificateStudent",
    JSON.stringify(data)
  );

    window.open("/login/institute/certificate/print", "_blank");

  };

  const getPhoto = (photoId) => {

    if (!photoId) return null;

    return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;

  };

  if (loading) {
    return <p className="p-10">Loading certificates...</p>;
  }

  return (
    <div className="p-10 bg-gray-100 min-h-screen">

      <h1 className="text-2xl font-bold mb-6">
        Certificate Approval Panel
      </h1>

      <div className="bg-white shadow rounded">

        <table className="w-full border">

          <thead className="bg-gray-200">

            <tr>
              <th className="border p-2">#</th>
              <th className="border p-2">Photo</th>
              <th className="border p-2">Student</th>
              <th className="border p-2">Course</th>
              <th className="border p-2">Marks</th>
              <th className="border p-2">Grade</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Action</th>
            </tr>

          </thead>

          <tbody>

            {certificates.map((c, index) => {

              const photoUrl = getPhoto(c.photoId);

              return (

                <tr key={c.$id}>

                  <td className="border p-2">{index + 1}</td>

                  <td className="border p-2">

                    {photoUrl && (
                      <img
                        src={photoUrl}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}

                  </td>

                  <td className="border p-2">
                    {c.studentName}
                  </td>

                  <td className="border p-2">
                    {c.course}
                  </td>

                  <td className="border p-2">
                    {c.marks}
                  </td>

                  <td className="border p-2">
                    {c.grade}
                  </td>

                  <td className="border p-2">

                    {c.status === "pending" && (
                      <span className="text-yellow-600 font-semibold">
                        Pending
                      </span>
                    )}

                    {c.status === "approved" && (
                      <span className="text-green-600 font-semibold">
                        Approved
                      </span>
                    )}

                    {c.status === "rejected" && (
                      <span className="text-red-600 font-semibold">
                        Rejected
                      </span>
                    )}

                  </td>

                  <td className="border p-2 flex gap-2">

                    {c.status === "pending" && (
                      <>
                        <button
                          onClick={() => approveCertificate(c.$id)}
                          className="bg-green-600 text-white px-3 py-1 rounded"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => rejectCertificate(c.$id)}
                          className="bg-red-600 text-white px-3 py-1 rounded"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {c.status === "approved" && (
                      <button
                        onClick={() => printCertificate(c)}
                        className="bg-blue-600 text-white px-3 py-1 rounded"
                      >
                        Print Certificate
                      </button>
                    )}

                  </td>

                </tr>

              );

            })}

          </tbody>

        </table>

      </div>

    </div>
  );
}
export const dynamic = "force-dynamic";