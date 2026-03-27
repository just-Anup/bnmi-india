"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { Query } from "appwrite";
import QRCode from "qrcode";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const CERT_COLLECTION = "certificates";
const BUCKET_ID = "6986e8a4001925504f6b";
export default function FranchiseCertificateView() {

  const [certificates, setCertificates] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getUser();
  }, []);

  // ✅ GET USER
  const getUser = async () => {
    try {
      const u = await account.get();
      setUser(u);
      loadCertificates(u.$id); // 🔥 USE createdById
    } catch (err) {
      console.log(err);
    }
  };

  // ✅ LOAD CERTIFICATES (FIXED)
  const loadCertificates = async (userId) => {
    try {

      const res = await databases.listDocuments(
        DATABASE_ID,
        CERT_COLLECTION,
        [
          Query.equal("status", "approved"),
          Query.equal("createdById", userId) // 🔥 MAIN FIX
        ]
      );

      console.log("CERTIFICATES:", res.documents);
      setCertificates(res.documents);

    } catch (err) {
      console.log(err);
    }
  };

  // ===============================
  // ✅ PRINT MARKSHEET
  // ===============================
  const printMarksheet = async (cert) => {
    try {

      let studentData = await databases.getDocument(
        DATABASE_ID,
        "student_admissions",
        cert.studentId
      );

      const franchiseRes = await databases.listDocuments(
        DATABASE_ID,
        "franchise_approved",
        [Query.equal("email", studentData.franchiseEmail)]
      );

      const franchiseData = franchiseRes.documents[0];

      const data = {
        studentName: studentData.studentName,
        fatherName: studentData.fatherName,
        course: studentData.courseName,
        instituteName: studentData.instituteName,
        studentId: cert.studentId,
        marksArray: cert.marksArray || [],
        grade: cert.grade,
        marksheetNo: cert.$id,
        franchiseSignature: franchiseData?.signature || "",
        logo: franchiseData?.logo || ""
      };

      localStorage.setItem("marksheetStudent", JSON.stringify(data));

      window.open("/login/institute/certificate/marksheet", "_blank");

    } catch (err) {
      console.log(err);
      alert("Marksheet error");
    }
  };

  // ===============================
  // ✅ PRINT CERTIFICATE
  // ===============================
  const printCertificate = async (cert) => {
    try {

      let studentData = await databases.getDocument(
        DATABASE_ID,
        "student_admissions",
        cert.studentId
      );

      const franchiseRes = await databases.listDocuments(
        DATABASE_ID,
        "franchise_approved",
        [Query.equal("email", studentData.franchiseEmail)]
      );

      const franchiseData = franchiseRes.documents[0];

      const certId = `CERT-${Date.now()}`;
      const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify/${certId}`;
      const qrCode = await QRCode.toDataURL(verifyUrl);

      const data = {
        studentName: studentData.studentName,
        course: studentData.courseName,
        grade: cert.grade,
        instituteName: studentData.instituteName,
        photoId: studentData.photoId,
        franchiseSignature: franchiseData?.signature || "",
        logo: franchiseData?.logo || "",
        qrCode,
        verifyUrl,
        certificateId: certId
      };

      localStorage.setItem("certificateStudent", JSON.stringify(data));

      window.open("/login/institute/certificate/print", "_blank");

    } catch (err) {
      console.log(err);
      alert("Certificate error");
    }
  };
  const getPhoto = (photoId) => {
  if (!photoId) return null;

  return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
};

  return (
    <div className="p-10">

      <h1 className="text-2xl font-bold mb-6">
        Approved Certificates
      </h1>

      <table className="w-full border">

        <thead>
          <tr>
            <th className="border p-2">#</th>
            <th className="border p-2">Photo</th>
            <th className="border p-2">Student</th>
            <th className="border p-2">Course</th>
            <th className="border p-2">Marks</th>
            <th className="border p-2">Grade</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>

        <tbody>

          {certificates.map((c, i) => (

            <tr key={c.$id}>

              <td className="border p-2">{i + 1}</td>
              <td className="border p-2">
  {getPhoto(c.photoId) ? (
    <img
      src={getPhoto(c.photoId)}
      className="w-12 h-12 rounded-full object-cover mx-auto border"
    />
  ) : (
    "N/A"
  )}
</td>
              <td className="border p-2">{c.studentName}</td>
              <td className="border p-2">{c.course}</td>
              <td className="border p-2">{c.marks}</td>
              <td className="border p-2">{c.grade}</td>

              <td className="border p-2 flex gap-2">

                <button
                  onClick={() => printCertificate(c)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                >
                  Certificate
                </button>

                <button
                  onClick={() => printMarksheet(c)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded"
                >
                  Marksheet
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}