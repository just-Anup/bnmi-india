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

    // ===============================
    // 🔹 FETCH STUDENT
    // ===============================
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

    // ===============================
    // 🔹 FETCH FRANCHISE
    // ===============================
    const franchiseRes = await databases.listDocuments(
      DATABASE_ID,
      "franchise_approved",
      [Query.equal("email", studentData.franchiseEmail)]
    );

    if (franchiseRes.documents.length > 0) {
      franchiseData = franchiseRes.documents[0];
    }

    // ===============================
    // 🔥 FETCH COURSE DURATION
    // ===============================
    let courseDuration = "";

    try {
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

      } else if (studentData.courseType === "single") {
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

      } else if (studentData.courseType === "multiple") {
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
    // 🔥 SUBJECT LIST
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
    // 🔥 MARKS PARSE
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
    // 🔥 FINAL MARKS LOGIC
    // ===============================
    let marksArray = [];

    if (studentData.courseType === "semester") {

      const sem = Number(cert.semesterNumber);

      if (!sem || isNaN(sem)) {
        alert("Semester number missing. Please re-apply certificate.");
        return;
      }

      const resultRes = await databases.listDocuments(
        DATABASE_ID,
        "exam_results",
        [
          Query.equal("studentId", cert.studentId),
          Query.equal("semesterNumber", sem)
        ]
      );

      if (!resultRes.documents.length) {
        alert("Result not found for this semester");
        return;
      }

      const result = resultRes.documents[0];

      marksArray =
        typeof result.marksArray === "string"
          ? JSON.parse(result.marksArray)
          : result.marksArray || [];

    } else {
      // ✅ SINGLE / BEAUTY / MULTIPLE
      marksArray = formattedMarks;
    }

    // ===============================
    // 🔥 FINAL DATA
    // ===============================
    const data = {
      studentName: studentData.studentName || "",
      fatherName: studentData.fatherName || "",
      surname: studentData.surname || "N/A",
      motherName: studentData.motherName || "N/A",

      dob: studentData.dob
        ? new Date(studentData.dob).toLocaleDateString("en-GB")
        : "N/A",

      course: studentData.courseName || "",

      coursePeriod:
        courseDuration ||
        studentData.duration ||
        studentData.courseDuration ||
        "N/A",

      instituteName: studentData.instituteName || "",
      studentId: cert.studentId,

      marksArray: marksArray,

      semesterNumber:
        studentData.courseType === "semester"
          ? cert.semesterNumber
          : null,

      grade: cert.grade || "",
      marksheetNo: cert.$id || "",

      franchiseSignature: franchiseData?.signature || "",
      logo: franchiseData?.logo || "",

      ownerName:
        franchiseData?.ownerName ||
        franchiseData?.owner ||
        franchiseData?.name ||
        ""
    };

    // ===============================
    // ✅ SAVE + OPEN
    // ===============================
    localStorage.setItem("marksheetStudent", JSON.stringify(data));

    if (studentData.courseType === "beauty") {
      window.open("/login/institute/certificate/beauty-marksheet", "_blank");

    } else if (studentData.courseType === "semester") {
      window.open("/login/institute/certificate/semester-marksheet", "_blank");

    } else if (studentData.courseType === "multiple") {
      window.open("/login/institute/certificate/multiple-marksheet", "_blank");

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

  const verifyUrl = `https://www.bnmiindia.org/beauty-verification/${cert.studentId}`;

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


let finalMarks = cert.marks;

if (studentData.courseType === "semester") {

  const allResults = await databases.listDocuments(
    DATABASE_ID,
    "exam_results",
    [Query.equal("studentId", cert.studentId)]
  );

  const total = allResults.documents.reduce(
    (sum, r) => sum + Number(r.percentage || 0),
    0
  );

  finalMarks =
    allResults.documents.length > 0
      ? Math.round(total / allResults.documents.length)
      : 0;
}


    // ===============================
    // 🔥 FINAL DATA (UNCHANGED)
    // ===============================
    const data = {
      studentName: studentData.studentName || "",
      marks: finalMarks,
      grade: cert.grade,
      course: studentData.courseName || "",
      duration: studentData.duration || "",
      signatureId: studentData.signatureId || "",
      franchiseSignature: franchiseData?.signature || "",
      photoId: studentData.photoId || "",
      instituteName: studentData.instituteName || "",
      semesterNumber:
  studentData.courseType === "semester"
    ? cert.semesterNumber
    : null,
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
    } else if (studentData.courseType === "multiple") {
      window.open("/login/institute/certificate/multiple-certificate", "_blank"); 
    
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

<div className="min-h-screen bg-gray-100 p-4 md:p-6">

    {/* HEADER */}
    <div className="mb-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
        Certificate Approval Panel
      </h1>
      <p className="text-gray-500 text-sm">
        Manage and approve student certificates
      </p>
    </div>

    {/* LIST */}
    <div className="flex flex-col gap-5">

      {certificates.length === 0 && (
        <div className="bg-white rounded-xl shadow p-10 text-center text-gray-500">
          No certificates found
        </div>
      )}

      {certificates.map((c, index) => {

        const photoUrl = getPhoto(c.photoId)

        return (
          <div
            key={c.$id}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-4 md:p-6 flex flex-col lg:flex-row justify-between gap-5"
          >

            {/* LEFT */}
            <div className="flex-1 min-w-[250px]">

              <div className="flex items-center gap-4 mb-3">
                <img
                  src={photoUrl}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border"
                />

                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {c.studentName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {c.course}
                  </p>
                </div>
              </div>

              {/* INFO */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-700">

                <p><b>Marks:</b> {c.marks}</p>
                <p><b>Grade:</b> {c.grade}</p>

                <p>
                  <b>Status:</b>{" "}
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
                </p>

              </div>

            </div>

            {/* RIGHT */}
            <div className="flex flex-wrap items-center gap-3">

              {c.status === "pending" && (
                <>
                  <ActionBtn
                    label="Approve"
                    color="green"
                    onClick={() => approveCertificate(c.$id)}
                  />

                  <ActionBtn
                    label="Reject"
                    color="red"
                    onClick={() => rejectCertificate(c.$id)}
                  />
                </>
              )}

              {c.status === "approved" && (
                <>
                  <ActionBtn
                    label="Certificate"
                    color="blue"
                    onClick={() => printCertificate(c)}
                  />

                  <ActionBtn
                    label="Marksheet"
                    color="purple"
                    onClick={() => printMarksheet(c)}
                  />
                </>
              )}

            </div>

          </div>
        )
      })}

    </div>

  </div>
)
}

function ActionBtn({ label, color, onClick }) {

  const colors = {
    blue: "from-blue-500 to-cyan-500",
    green: "from-green-500 to-emerald-500",
    red: "from-red-500 to-pink-500",
    purple: "from-purple-500 to-indigo-500",
  }

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium text-white rounded-lg bg-gradient-to-r ${colors[color]} shadow hover:scale-105 hover:shadow-lg transition`}
    >
      {label}
    </button>
  )
}