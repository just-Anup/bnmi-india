"use client";

import { useEffect, useState } from "react";

const BUCKET_ID = "6986e8a4001925504f6b";

export default function PrintHallTicket() {

  const [students, setStudents] = useState([]);
  const [exam, setExam] = useState(null);
  const [franchise, setFranchise] = useState(null);

  useEffect(() => {

    const s = localStorage.getItem("hallticketStudents");
    const e = localStorage.getItem("hallticketExam");
    const f = localStorage.getItem("hallticketFranchise");

    if (s) setStudents(JSON.parse(s));
    if (e) setExam(JSON.parse(e));
    if (f) setFranchise(JSON.parse(f));

  }, []);

  const printPage = () => {
    window.print();
  };

  if (!exam) {
    return (
      <div className="p-10 bg-black text-white min-h-screen">
        Loading...
      </div>
    );
  }

  return (

    <div className="p-6 bg-black min-h-screen text-white">

      <button
        onClick={printPage}
        className="bg-orange-500 hover:bg-orange-600 text-black font-semibold px-6 py-2 rounded mb-6"
      >
        Print Hall Ticket
      </button>

      {students.map((student, index) => {

        // ✅ PHOTO
        const photoUrl = student.photoId
          ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
          : null;

const signatureUrl = student.signatureId
  ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.signatureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
  : null;
const franchiseSign = franchise?.signature || null; `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${franchise.signatureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
 

        return (

          <div key={index} className="relative w-[800px] h-[1100px] mb-10 bg-white text-black">

            {/* BACKGROUND TEMPLATE */}
            <img
              src="/hall.png"
              className="absolute top-0 left-0 w-full h-full"
            />

            {/* PHOTO */}
            {photoUrl && (
              <img
                src={photoUrl}
                className="absolute top-[270px] left-[86px] w-[120px] h-[120px] object-cover"
              />
            )}

            {/* COURSE NAME */}
            <div className="absolute top-[275px] left-[310px] font-semibold">
              {student.courseName}
            </div>

            {/* COURSE DURATION */}
            <div className="absolute top-[300px] left-[330px]">
             {exam.duration || student.duration || "N/A"}
            </div>

            {/* STUDENT NAME */}
            <div className="absolute top-[415px] left-[190px]">
              {student.studentName}
            </div>

            {/* FATHER NAME */}
            <div className="absolute top-[460px] left-[240px]">
              {student.fatherName}
            </div>

            {/* SURNAME */}
            <div className="absolute top-[504px] left-[160px]">
              {student.surname}
            </div>

            {/* MOTHER NAME */}
            <div className="absolute top-[546px] left-[180px]">
              {student.motherName}
            </div>

            {/* USERNAME */}
            <div className="absolute top-[345px] left-[350px]">
              {student.username}
            </div>

            {/* PASSWORD */}
            <div className="absolute top-[370px] left-[350px]">
              {student.password}
            </div>

            {/* EXAM DATE */}
            <div className="absolute top-[415px] left-[470px]">
              {exam.examDate}
            </div>

            {/* EXAM TIME */}
            <div className="absolute top-[460px] left-[490px]">
              {exam.startTime} - {exam.endTime}
            </div>
            {/* EXAM TIME */}
            <div className="absolute top-[502px] left-[510px]">
            {exam.duration || student.duration || "N/A"}
            </div>


            {/* REPORTING TIME */}
            <div className="absolute top-[545px] left-[500px]">
              {exam.reportingTime}
            </div>

            {/* CENTER ADDRESS */}
            <div className="absolute top-[585px] left-[390px] w-[300px] text-sm">
              Rukminigaon House No 74<br />
              Opp Golmohar Apartment, Guwahati
            </div>

            {/* STUDENT SIGNATURE */}
            {signatureUrl ? (
  <img
    src={signatureUrl}
    className="absolute bottom-[280px] left-[490px] w-[140px] h-[60px] object-contain border"
  />
) : (
  <div className="absolute bottom-[250px] left-[120px] text-red-500">
    No Signature
  </div>
)}

            {/* FRANCHISE SIGNATURE */}
           {franchiseSign && (
  <img
    src={franchiseSign}
    className="absolute bottom-[280px] right-[500px] w-[160px] h-[60px] object-contain"
  />
)}

          </div>

        );

      })}

    </div>

  );

}