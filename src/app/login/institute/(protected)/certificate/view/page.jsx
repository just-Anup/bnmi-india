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

  // GET USER
  const getUser = async () => {

    try {

      const u = await account.get();

      setUser(u);

      loadCertificates(u.$id);

    } catch (err) {

      console.log(err);

    }
  };

  // LOAD CERTIFICATES
  const loadCertificates = async (userId) => {

    try {

      const res = await databases.listDocuments(
        DATABASE_ID,
        CERT_COLLECTION,
        [
          Query.equal("status", "approved"),
          Query.equal("createdById", userId)
        ]
      );

      setCertificates(res.documents);

    } catch (err) {

      console.log(err);

    }
  };

  // PRINT CERTIFICATE
  const printCertificate = async (cert) => {

    try {

      const studentData = await databases.getDocument(
        DATABASE_ID,
        "student_admissions",
        cert.studentId
      );

      // FRANCHISE
      const franchiseRes = await databases.listDocuments(
        DATABASE_ID,
        "franchise_approved",
        [Query.equal("email", studentData.franchiseEmail)]
      );

      const franchiseData =
        franchiseRes.documents[0];

      // QR
      const verifyUrl =
        `https://www.bnmiindia.org/beauty-verification/${cert.studentId}`;

      const qrCode =
        await QRCode.toDataURL(verifyUrl);

      // FINAL DATA
      const data = {

        readOnly: true,

        studentId: cert.studentId,

        studentName:
          cert.studentName ||
          studentData.studentName ||
          "",

        fatherName:
          cert.fatherName ||
          studentData.fatherName ||
          "",

        motherName:
          cert.motherName ||
          studentData.motherName ||
          "",

        relationType:
          studentData.relationType || "S/O",

        showFatherInCertificate:
          String(
            studentData.showFatherInCertificate
          ).toLowerCase() === "true",

        showMotherInCertificate:
          String(
            studentData.showMotherInCertificate
          ).toLowerCase() === "true",

        course:
          cert.course ||
          studentData.courseName ||
          "",

        duration:
          cert.duration || "N/A",

        grade:
          cert.grade || "",

        marks:
          cert.marks || "",

        instituteName:
          cert.instituteName ||
          studentData.instituteName ||
          "",

        photoId:
          studentData.photoId || "",

        signatureId:
          studentData.signatureId || "",

        franchiseSignature:
          cert.franchiseSignature ||
          franchiseData?.signature ||
          "",

        logo:
          franchiseData?.logo || "",

        ownerName:
          franchiseData?.ownerName ||
          franchiseData?.owner ||
          franchiseData?.name ||
          "",

        city:
          cert.city ||
          franchiseData?.city ||
          franchiseData?.address ||
          "",

        address:
          franchiseData?.address || "",

        qrCode,
        verifyUrl,

        certificateNo:
          cert.certificateNo ||
          `CERT-${Date.now()}`,

        issueDate:
          cert.issueDate || "",

        semesterNumber:
          studentData.courseType === "semester"
            ? cert.semesterNumber
            : null
      };

      // OPEN CERTIFICATE
      if (studentData.courseType === "beauty") {

        window.open(
          `/login/institute/certificate/beauty-certificate/${cert.$id}`,
          "_blank"
        );

      } else if (
        studentData.courseType === "semester"
      ) {

        window.open(
          `/login/institute/certificate/semester-certificate/${cert.$id}`,
          "_blank"
        );

      } else if (
        studentData.courseType === "multiple"
      ) {

        window.open(
          `/login/institute/certificate/multiple-certificate/${cert.$id}`,
          "_blank"
        );

      } else {

        window.open(
          `/login/institute/certificate/print/${cert.$id}`,
          "_blank"
        );
      }

    } catch (err) {

      console.log(err);

      alert("Certificate error");

    }
  };

  // PRINT MARKSHEET
  const printMarksheet = async (cert) => {

    try {

      const studentData =
        await databases.getDocument(
          DATABASE_ID,
          "student_admissions",
          cert.studentId
        );

      // FRANCHISE
      const franchiseRes =
        await databases.listDocuments(
          DATABASE_ID,
          "franchise_approved",
          [
            Query.equal(
              "email",
              studentData.franchiseEmail
            )
          ]
        );

      const franchiseData =
        franchiseRes.documents[0];

      // SUBJECT MARKS
      let marksArray = [];

      try {

        const res =
          await databases.listDocuments(
            DATABASE_ID,
            "student_subject_results",
            [
              Query.equal(
                "studentId",
                cert.studentId
              )
            ]
          );

        marksArray = res.documents.map((m) => ({
          subject: m.subject,
          objective: Number(
            m.objective || 0
          ),
          practical: Number(
            m.practical || 0
          ),
          total: Number(m.total || 0),
        }));

      } catch (err) {

        console.log(
          "MARK FETCH ERROR:",
          err
        );

      }


      // ✅ SAVE NEW STUDENT DATA
const finalData = {

  ...studentData,
  ...cert,

  studentId: cert.studentId,

  studentName:
    cert.studentName ||
    studentData.studentName ||
    "",

  fatherName:
    cert.fatherName ||
    studentData.fatherName ||
    "",

  motherName:
    cert.motherName ||
    studentData.motherName ||
    "",

  course:
    cert.course ||
    studentData.courseName ||
    "",

  instituteName:
    cert.instituteName ||
    studentData.instituteName ||
    "",

  duration:
    cert.duration || "",

  marks:
    cert.marks || "",

  grade:
    cert.grade || "",

  logo:
    franchiseData?.logo || "",

  ownerName:
    franchiseData?.ownerName ||
    franchiseData?.owner ||
    franchiseData?.name ||
    "",

  franchiseSignature:
    franchiseData?.signature || "",

  photoId:
    studentData.photoId || "",

  signatureId:
    studentData.signatureId || "",

  dob:
    studentData.dob || "",

  coursePeriod:
    cert.duration || "",

  courseType:
    studentData.courseType || "",

  marksheetNo:
    cert.certificateNo || "",

  marksArray
};

// ✅ REMOVE OLD DATA
localStorage.removeItem("marksheetStudent");

// ✅ SAVE NEW DATA
localStorage.setItem(
  "marksheetStudent",
  JSON.stringify(finalData)
);


   // OPEN MARKSHEET WITH ID
if (studentData.courseType === "beauty") {

  window.open(
    `/login/institute/certificate/beauty-marksheet/${cert.$id}`,
    "_blank"
  );

} else if (
  studentData.courseType === "semester"
) {

  window.open(
    `/login/institute/certificate/semester-marksheet/${cert.$id}`,
    "_blank"
  );

} else if (
  studentData.courseType === "multiple"
) {

  window.open(
    `/login/institute/certificate/multiple-marksheet/${cert.$id}`,
    "_blank"
  );

} else {

  window.open(
    `/login/institute/certificate/marksheet/${cert.$id}`,
    "_blank"
  );
}
    } catch (err) {

      console.log(err);

      alert("Marksheet error");

    }
  };

  // PHOTO
  const getPhoto = (photoId) => {

    if (!photoId) return null;

    return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
  };

  return (

    <div className="min-h-screen bg-gray-100 p-3 sm:p-5 lg:p-10">

      {/* HEADER */}
      <div className="mb-6">

        <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
          Approved Certificates
        </h1>

      </div>

      {/* TABLE CARD */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[900px] border-collapse text-xs sm:text-sm">

            <thead className="bg-gray-100">

              <tr>

                <th className="border p-3 whitespace-nowrap">
                  #
                </th>

                <th className="border p-3 whitespace-nowrap">
                  Photo
                </th>

                <th className="border p-3 whitespace-nowrap">
                  Student
                </th>

                <th className="border p-3 whitespace-nowrap">
                  Course
                </th>

                <th className="border p-3 whitespace-nowrap">
                  Marks
                </th>

                <th className="border p-3 whitespace-nowrap">
                  Grade
                </th>

                <th className="border p-3 whitespace-nowrap">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {certificates.map((c, i) => (

                <tr
                  key={c.$id}
                  className="hover:bg-gray-50 transition"
                >

                  {/* INDEX */}
                  <td className="border p-3 whitespace-nowrap">
                    {i + 1}
                  </td>

                  {/* PHOTO */}
                  <td className="border p-3">

                    {getPhoto(c.photoId) ? (

                      <img
                        src={getPhoto(c.photoId)}
                        alt="student"
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover mx-auto border"
                      />

                    ) : (

                      <span className="text-gray-500">
                        N/A
                      </span>

                    )}

                  </td>

                  {/* STUDENT */}
                  <td className="border p-3 min-w-[180px] break-words">
                    {c.studentName}
                  </td>

                  {/* COURSE */}
                  <td className="border p-3 min-w-[200px] break-words">
                    {c.course}
                  </td>

                  {/* MARKS */}
                  <td className="border p-3 whitespace-nowrap">
                    {c.marks}
                  </td>

                  {/* GRADE */}
                  <td className="border p-3 whitespace-nowrap">
                    {c.grade}
                  </td>

                  {/* ACTION */}
                  <td className="border p-3">

                    <div className="flex flex-col sm:flex-row gap-2 min-w-[180px]">

                      <button
                        onClick={() =>
                          printCertificate(c)
                        }
                        className="bg-blue-600 hover:bg-blue-700 transition text-white px-3 py-2 rounded-lg text-xs sm:text-sm"
                      >
                        Certificate
                      </button>

                      <button
                        onClick={() =>
                          printMarksheet(c)
                        }
                        className="bg-purple-600 hover:bg-purple-700 transition text-white px-3 py-2 rounded-lg text-xs sm:text-sm"
                      >
                        Marksheet
                      </button>

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}