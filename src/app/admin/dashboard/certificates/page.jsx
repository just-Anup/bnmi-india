"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import QRCode from "qrcode";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const CERT_COLLECTION = "certificates";
const BUCKET_ID = "6986e8a4001925504f6b";


// inside printCertificate

const certId = `CERT-${Date.now()}`

const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/beauty-verification/${certId}`

const qrCode = await QRCode.toDataURL(verifyUrl)
export default function CertificateApprovalPage() {

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===============================
  // ✅ MARKSHEET PRINT
  // ===============================
const printMarksheet = async (cert) => {
  try {

    let studentData = null;
    let franchiseData = null;

    // 🔹 FETCH STUDENT
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

    // 🔹 FETCH FRANCHISE
    const franchiseRes = await databases.listDocuments(
      DATABASE_ID,
      "franchise_approved",
      [Query.equal("email", studentData.franchiseEmail)]
    );

    if (franchiseRes.documents.length > 0) {
      franchiseData = franchiseRes.documents[0];
    }

    // ===============================
    // 🔥 FETCH COURSE DURATION (FINAL FIX)
    // ===============================
   let courseDuration = "";

try {

  // 🔥 BEAUTY COURSE
  if (studentData.courseType === "beauty") {

    const res = await databases.listDocuments(
      DATABASE_ID,
      "beauty_courses_single",
      [
        Query.equal("courseName", studentData.courseName),
        Query.equal("franchiseEmail", studentData.franchiseEmail)
      ]
    );

    if (res.documents.length > 0) {
      courseDuration = res.documents[0].duration || "";
    }

  }

  // 🔥 SINGLE COURSE
  else if (studentData.courseType === "single") {

    const res = await databases.listDocuments(
      DATABASE_ID,
      "courses_single",
      [
        Query.equal("courseName", studentData.courseName),
        Query.equal("franchiseEmail", studentData.franchiseEmail)
      ]
    );

    if (res.documents.length > 0) {
      courseDuration = res.documents[0].duration || "";
    }

  }

  // 🔥 MULTIPLE COURSE
  else if (studentData.courseType === "multiple") {

    const res = await databases.listDocuments(
      DATABASE_ID,
      "course_master_multiple",
      [
        Query.equal("courseName", studentData.courseName)
      ]
    );

    if (res.documents.length > 0) {
      courseDuration = res.documents[0].duration || "";
    }

  }

} catch (err) {
  console.log("COURSE DURATION ERROR:", err);
}

    // ===============================
    // 🔥 SUBJECT LOGIC
    // ===============================
    let subjectList = [];

    if (
      studentData.courseType === "single" ||
      studentData.courseType === "beauty"
    ) {
      subjectList = [
        studentData.subjects
          ?.split(",")
          .map((s) => s.trim())
          .join(", "),
      ];
    } else {
      subjectList =
        studentData.subjects
          ?.split(",")
          .map((s) => s.trim()) || [];
    }

    // ===============================
    // 🔥 MARKS PARSE (OLD SUPPORT)
    // ===============================
    let parsedMarks = [];

    try {
      if (typeof cert.marks === "string" && cert.marks.startsWith("[")) {
        parsedMarks = JSON.parse(cert.marks);
      } else if (!isNaN(cert.marks)) {
        parsedMarks = [
          {
            subject: subjectList[0] || "Subject",
            theory: Number(cert.marks),
            practical: 0,
          },
        ];
      } else if (Array.isArray(cert.marks)) {
        parsedMarks = cert.marks;
      }
    } catch (err) {
      console.log("MARK PARSE ERROR:", err);
    }

    // ===============================
    // 🔥 FORMAT MARKS
    // ===============================
    const formattedMarks = parsedMarks.map((m, index) => ({
      subject:
        subjectList[index] ||
        m.subject ||
        `Subject ${index + 1}`,

      objective: Number(m.theory || m.objective || 0),
      practical: Number(m.practical || 0),

      total:
        Number(m.theory || m.objective || 0) +
        Number(m.practical || 0),
    }));

    // ===============================
    // 🔥 FINAL DATA (FIXED DOB + DURATION)
    // ===============================
    const data = {
  studentName: studentData.studentName || "",
  fatherName: studentData.fatherName || "",

  // ✅ FIXED (NOW ALWAYS COMES)
  surname: studentData.surname || "N/A",
  motherName: studentData.motherName || "N/A",

  // ✅ DOB FIX
  dob: studentData.dob
    ? new Date(studentData.dob).toLocaleDateString("en-GB")
    : "N/A",

  // ✅ COURSE NAME
  course: studentData.courseName || "",

  // ✅ 🔥 COURSE PERIOD FIX (MAIN ISSUE)
  coursePeriod:
    courseDuration ||
    studentData.duration ||
    studentData.courseDuration ||
    "N/A",

  instituteName: studentData.instituteName || "",
  studentId: cert.studentId,

  // ✅ MARKS
  marksArray:
    cert.marksArray && cert.marksArray.length > 0
      ? cert.marksArray
      : formattedMarks,

  grade: cert.grade || "",
  marksheetNo: cert.$id || "",

  // ✅ SIGNATURE + LOGO
  franchiseSignature: franchiseData?.signature || "",
  logo: franchiseData?.logo || "",

  // ✅ OWNER NAME (OPTIONAL)
  ownerName:
    franchiseData?.ownerName ||
    franchiseData?.owner ||
    franchiseData?.name ||
    ""
};
    // ✅ SAVE TO LOCAL STORAGE
    localStorage.setItem(
      "marksheetStudent",
      JSON.stringify(data)
    );

    // 🔥 OPEN MARKSHEET
    if (studentData.courseType === "beauty") {

  window.open("/login/institute/certificate/beauty-marksheet", "_blank");

} else if (studentData.courseType === "semester") {

  window.open("/login/institute/certificate/semester-marksheet", "_blank");

} else {

  window.open("/login/institute/certificate/marksheet", "_blank");

}

  } catch (err) {
    console.error("MARKSHEET ERROR:", err);
    alert("Failed to generate marksheet");
  }
};
  // ===============================
  // ✅ CERTIFICATE PRINT
  // ===============================
const printCertificate = async (cert) => {

  try {

    let studentData = null;
    let franchiseData = null;

    // 🔹 FETCH STUDENT
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

    // 🔹 FETCH FRANCHISE
    const franchiseRes = await databases.listDocuments(
      DATABASE_ID,
      "franchise_approved",
      [Query.equal("email", studentData.franchiseEmail)]
    );

    if (franchiseRes.documents.length > 0) {
      franchiseData = franchiseRes.documents[0];
    }

    // ===============================
    // ✅ ONLY CHANGE — USE studentId
    // ===============================
    const verifyId = cert.studentId;

    const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/beauty-verification/${verifyId}`;

    const qrCode = await QRCode.toDataURL(verifyUrl);
    // ✅ GENERATE CERTIFICATE DATA
const certificateNo = `CERT-${Date.now()}`;
const issueDate = new Date().toISOString();

// ✅ SAVE IN DATABASE
await databases.updateDocument(
  DATABASE_ID,
  "certificates",
  cert.$id,
  {
    certificateNo: certificateNo,
    issueDate: issueDate,
    duration: studentData.duration || ""
  }
);

    // ===============================
    // 🔥 FINAL DATA (UNCHANGED)
    // ===============================
    const data = {
      studentName: studentData.studentName || "",
      marks: cert.marks,
      grade: cert.grade,
      course: studentData.courseName || "",
      duration: studentData.duration || "",
      signatureId: studentData.signatureId || "",
      franchiseSignature: franchiseData?.signature || "",
      photoId: studentData.photoId || "",
      instituteName: studentData.instituteName || "",
      city: franchiseData?.city || "",
      address: franchiseData?.address || "",
       certificateNo: `CERT-${Date.now()}`, // ✅ NEW
  issueDate: new Date().toISOString(), // ✅ NEW
      logo: franchiseData?.logo || "",
      ownerName:
        franchiseData?.ownerName ||
        franchiseData?.owner ||
        franchiseData?.name ||
        "",

      // ✅ KEEP SAME
      studentId: cert.studentId,

      // ✅ QR
      qrCode,
      verifyUrl
    };

    localStorage.setItem("certificateStudent", JSON.stringify(data));

    // 🔄 OPEN PAGE
    if (studentData.courseType === "beauty") {
      window.open("/login/institute/certificate/beauty-certificate", "_blank");
    } else if (studentData.courseType === "semester") {
      window.open("/login/institute/certificate/semester-certificate", "_blank");
    } else {
      window.open("/login/institute/certificate/print", "_blank");
    }

  } catch (err) {
    console.error("CERT ERROR:", err);
    alert("Failed to open certificate");
  }
};
  // ===============================
  // 🔹 LOAD DATA
  // ===============================
  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      const res = await databases.listDocuments(DATABASE_ID, CERT_COLLECTION);
      setCertificates(res.documents || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const approveCertificate = async (id) => {
    await databases.updateDocument(DATABASE_ID, CERT_COLLECTION, id, {
      status: "approved"
    });
    loadCertificates();
  };

  const rejectCertificate = async (id) => {
    await databases.updateDocument(DATABASE_ID, CERT_COLLECTION, id, {
      status: "rejected"
    });
    loadCertificates();
  };

  const getPhoto = (photoId) => {
    return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
  };

  if (loading) return <p className="p-10">Loading...</p>;

 return (
  <div className="p-10 bg-gray-100 min-h-screen">

    <h1 className="text-3xl font-bold mb-8 text-gray-800">
      Certificate Approval Panel
    </h1>

    <div className="bg-white shadow-md rounded-lg overflow-hidden">

      <table className="w-full border-collapse text-sm">

        <thead className="bg-gray-200 text-gray-700">
          <tr>
            <th className="p-3 border">#</th>
            <th className="p-3 border">Photo</th>
            <th className="p-3 border">Student</th>
            <th className="p-3 border">Course</th>
            <th className="p-3 border">Marks</th>
            <th className="p-3 border">Grade</th>
            <th className="p-3 border">Status</th>
            <th className="p-3 border">Action</th>
          </tr>
        </thead>

        <tbody>

          {certificates.map((c, index) => {

            const photoUrl = getPhoto(c.photoId);

            return (
              <tr
                key={c.$id}
                className="hover:bg-gray-50 transition duration-200"
              >

                <td className="p-3 border text-center">{index + 1}</td>

                <td className="p-3 border text-center">
                  <img
                    src={photoUrl}
                    className="w-12 h-12 rounded-full object-cover mx-auto"
                  />
                </td>

                <td className="p-3 border font-medium">
                  {c.studentName}
                </td>

                <td className="p-3 border">
                  {c.course}
                </td>

                <td className="p-3 border text-center">
                  {c.marks}
                </td>

                <td className="p-3 border text-center font-semibold">
                  {c.grade}
                </td>

                <td className="p-3 border text-center">

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

                <td className="p-3 border">

                  <div className="flex gap-2 justify-center flex-wrap">

                    {c.status === "pending" && (
                      <>
                        <button
                          onClick={() => approveCertificate(c.$id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => rejectCertificate(c.$id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {c.status === "approved" && (
                      <>
                        <button
                          onClick={() => printCertificate(c)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                        >
                          Certificate
                        </button>

                        <button
                          onClick={() => printMarksheet(c)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs"
                        >
                          Marksheet
                        </button>
                      </>
                    )}

                  </div>

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