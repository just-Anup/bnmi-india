"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const CERT_COLLECTION = "certificates";
const BUCKET_ID = "6986e8a4001925504f6b";

export default function CertificateApprovalPage() {
  const [certificates, setCertificates] = useState([]);



  const [loading, setLoading] = useState(true);
const printMarksheet = async (cert) => {

  try {

    let studentData = null;
    let franchiseData = null;

    // ✅ FETCH STUDENT
    if (cert.studentId) {
      studentData = await databases.getDocument(
        DATABASE_ID,
        "student_admissions",
        cert.studentId
      );
    } else {
      const res = await databases.listDocuments(
        DATABASE_ID,
        "student_admissions",
        [Query.equal("studentName", cert.studentName)]
      );

      if (!res.documents.length) {
        alert("Student not found");
        return;
      }

      studentData = res.documents[0];
    }

    // ✅ FETCH FRANCHISE
    const franchiseRes = await databases.listDocuments(
      DATABASE_ID,
      "franchise_approved",
      [Query.equal("email", studentData.franchiseEmail)]
    );

    if (franchiseRes.documents.length > 0) {
      franchiseData = franchiseRes.documents[0];
    }

    // ===============================
    // ✅ FIXED MARKS LOGIC (IMPORTANT)
    // ===============================

    let parsedMarks = [];

    try {

      // CASE 1: JSON string (multiple subjects)
      if (typeof cert.marks === "string" && cert.marks.startsWith("[")) {
        parsedMarks = JSON.parse(cert.marks);
      }

      // CASE 2: single number ("70")
      else if (!isNaN(cert.marks)) {
        parsedMarks = [{
          subject: cert.course || studentData.courseName || "Subject",
          theory: Number(cert.marks),
          practical: 0
        }];
      }

      // CASE 3: already array
      else if (Array.isArray(cert.marks)) {
        parsedMarks = cert.marks;
      }

    } catch (err) {
      console.log("MARK PARSE ERROR:", err);
    }

    // ✅ FORMAT MARKS
    const formattedMarks = parsedMarks.map((m, index) => ({

      subject: m.subject || `Subject ${index + 1}`,

      objective: Number(m.theory || m.objective || 0),
      practical: Number(m.practical || 0),

      total:
        Number(m.theory || m.objective || 0) +
        Number(m.practical || 0)

    }));

    // ===============================
    // ✅ FINAL DATA
    // ===============================

    const data = {
      studentName: studentData.studentName,
      fatherName: studentData.fatherName,
      surname: studentData.surname,
      motherName: studentData.motherName,

      course: studentData.courseName,
      dob: studentData.dob,

      instituteName: studentData.instituteName,

      marksArray: formattedMarks, // ✅ FIXED

      grade: cert.grade || "",
      marksheetNo: cert.$id || "",

      // ✅ SIGNATURE
      franchiseSignature: franchiseData?.signature || ""
    };

    console.log("FINAL MARKSHEET DATA:", data);

    localStorage.setItem("marksheetStudent", JSON.stringify(data));

    window.open("/login/institute/certificate/marksheet", "_blank");

  } catch (err) {

    console.error("MARKSHEET ERROR:", err);
    alert("Failed to generate marksheet");

  }
};
  useEffect(() => {
    if (!databases || !DATABASE_ID) return;
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      if (!databases || !DATABASE_ID) return;
      const res = await databases.listDocuments(DATABASE_ID, CERT_COLLECTION);
      setCertificates(res.documents || []);
    } catch (err) {
      console.log("Load certificates error:", err);
    } finally {
      setLoading(false);
    }
  };

  const approveCertificate = async (id) => {
    try {
      await databases.updateDocument(DATABASE_ID, CERT_COLLECTION, id, {
        status: "approved",
      });
      alert("Certificate Approved");
      loadCertificates();
    } catch (err) {
      console.log(err);
    }
  };

  const rejectCertificate = async (id) => {
    try {
      await databases.updateDocument(DATABASE_ID, CERT_COLLECTION, id, {
        status: "rejected",
      });
      alert("Certificate Rejected");
      loadCertificates();
    } catch (err) {
      console.log(err);
    }
  };

const printCertificate = async (cert) => {

  try {

    let studentData = null;
    let franchiseData = null;

    // ✅ FETCH STUDENT
    if (cert.studentId) {

      studentData = await databases.getDocument(
        DATABASE_ID,
        "student_admissions",
        cert.studentId
      );

    } else {

      const res = await databases.listDocuments(
        DATABASE_ID,
        "student_admissions",
        [Query.equal("studentName", cert.studentName)]
      );

      if (!res.documents.length) {
        alert("Student not found");
        return;
      }

      studentData = res.documents[0];
    }

    // ✅ FETCH FRANCHISE (IMPORTANT)
    const franchiseRes = await databases.listDocuments(
      DATABASE_ID,
      "franchise_approved",
      [Query.equal("email", studentData.franchiseEmail)]
    );

    if (franchiseRes.documents.length > 0) {
      franchiseData = franchiseRes.documents[0];
    }

    // ✅ FINAL DATA
    const data = {
      studentName: studentData.studentName || "",
      marks: cert.marks,
      grade: cert.grade,
      course: studentData.courseName || "",

      // ✅ STUDENT SIGNATURE
      signatureId: studentData.signatureId || "",

      // ✅ FRANCHISE SIGNATURE (FULL URL)
      franchiseSignature: franchiseData?.signature || "",

      photoId: studentData.photoId || "",

      instituteName: studentData.instituteName || "",
      createdById: studentData.createdById || ""
    };

    console.log("FINAL CERT DATA:", data);

    localStorage.setItem("certificateStudent", JSON.stringify(data));

    window.open("/login/institute/certificate/print", "_blank");

  } catch (err) {

    console.error("CERT ERROR:", err);
    alert("Failed to open certificate");

  }
};
  const getPhoto = (photoId) => {
    if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) return null;
    return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
  };

  if (loading || !DATABASE_ID) {
    return <p className="p-10">Loading certificates...</p>;
  }

  return (
    <div className="p-10 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Certificate Approval Panel</h1>
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
                        alt="student"
                      />
                    )}
                  </td>
                  <td className="border p-2">{c.studentName}</td>
                  <td className="border p-2">{c.course}</td>
                  <td className="border p-2">{c.marks}</td>
                  <td className="border p-2">{c.grade}</td>
                  <td className="border p-2">
                    {c.status === "pending" && (
                      <span className="text-yellow-600 font-semibold">Pending</span>
                    )}
                    {c.status === "approved" && (
                      <span className="text-green-600 font-semibold">Approved</span>
                    )}
                    {c.status === "rejected" && (
                      <span className="text-red-600 font-semibold">Rejected</span>
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
                      <div className="flex gap-2">
  <button
    onClick={() => printCertificate(c)}
    className="bg-blue-600 text-white px-3 py-1 rounded"
  >
    View Certificate
  </button>

  <button
    onClick={() => printMarksheet(c)}
    className="bg-purple-600 text-white px-3 py-1 rounded"
  >
    View Marksheet
  </button>
</div>
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