"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import {
  CheckCircle,
  GraduationCap,
  Calendar,
  Clock3,
  BadgeCheck,
  School,
  Mail,
  Phone,
  MapPin,
  Trophy,
  FileBadge2,
} from "lucide-react";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const BUCKET_ID = "6986e8a4001925504f6b";

export default function VerifyCertificate() {

  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [percentage, setPercentage] = useState(null);
  const [isMultiple, setIsMultiple] = useState(false);

  // =========================
  // FETCH DATA
  // =========================
  useEffect(() => {

    if (!id) return;

const fetchAll = async () => {

  try {

    // =========================
    // CERTIFICATE ONLY
    // =========================
    const certRes = await databases.listDocuments(
      DATABASE_ID,
      "certificates",
      [Query.equal("studentId", id)]
    );

    if (!certRes.documents.length) {
      setData(false);
      return;
    }

    const certificate = certRes.documents[0];

    // =========================
    // FRANCHISE
    // =========================
    let franchise = null;

    if (certificate.franchiseId) {

      try {

        const res = await databases.getDocument(
          DATABASE_ID,
          "franchise_approved",
          certificate.franchiseId
        );

        franchise = res;

      } catch (err) {
        console.log(err);
      }

    }

    // =========================
    // CREATE STUDENT OBJECT
    // =========================
    const student = {

      studentName:
        certificate.studentName || "",

      fatherName:
        certificate.fatherName || "",

      motherName:
        certificate.motherName || "",

      courseName:
        certificate.course || "",

      instituteName:
        certificate.instituteName || "",

      photoId:
        certificate.photoId || "",

      duration:
        certificate.duration || "",

      courseDuration:
        certificate.coursePeriod || ""

    };

    setData({
      student,
      certificate,
      franchise,
      courseDuration:
        certificate.coursePeriod || ""
    });

  } catch (err) {

    console.log(err);
    setData(false);

  } finally {

    setLoading(false);

  }

};
    fetchAll();

  }, [id]);

  // =========================
  // PERCENTAGE
  // =========================
  useEffect(() => {

    const fetchPercentage = async () => {

      try {

        if (!id) return;

        const res = await databases.listDocuments(
          DATABASE_ID,
          "student_subject_results",
          [Query.equal("studentId", id)]
        );

        if (res.documents.length > 1) {

          setIsMultiple(true);

          const total = res.documents.reduce(
            (sum, item) => sum + Number(item.total || 0),
            0
          );

          const percent = (
            total / (res.documents.length * 100)
          ).toFixed(2);

          setPercentage(percent);

        } else {

          setIsMultiple(false);

        }

      } catch (err) {

        console.log(err);

      }
    };

    fetchPercentage();

  }, [id]);

  // =========================
  // LOADING
  // =========================
  if (loading) {

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl font-semibold animate-pulse">
          Loading Verification...
        </div>
      </div>
    );
  }

  // =========================
  // INVALID
  // =========================
  if (data === false) {

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">

        <div className="bg-white p-10 rounded-3xl shadow-xl">

          <h1 className="text-2xl font-bold text-red-600">
            Invalid Certificate
          </h1>

        </div>

      </div>
    );
  }

  const {
    student,
    certificate,
    franchise,
    courseDuration
  } = data;

  // =========================
  // PHOTO
  // =========================
  const photoUrl = student.photoId
    ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
    : null;

  

  

  // =========================
  // LOGO
  // =========================
 const logoUrl =
  certificate?.logo ||
  franchise?.logo ||
  null;
  // =========================
  // DATE FORMAT
  // =========================
  const formatIssueDate = (date) => {

    try {

      if (!date) return "N/A";

      // already formatted
      if (
        typeof date === "string" &&
        date.includes("-") &&
        !date.includes("T")
      ) {
        return date;
      }

      return new Date(date)
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-");

    } catch {

      return "N/A";
    }
  };

// ✅ ISSUE DATE FROM CERTIFICATE DB
const finalIssueDate =
  certificate?.issueDate || "";


  // ✅ DURATION FROM DB
const finalDuration =
  certificate?.coursePeriod ||
  certificate?.duration ||
  "N/A";

  return (

    <div className="min-h-screen bg-gradient-to-br from-[#faf7f0] via-white to-[#f3efe6] flex justify-center p-4">

      <div className="w-full max-w-md border-[3px] border-yellow-500 rounded-[35px] bg-white shadow-2xl overflow-hidden">

        {/* TOP */}
        <div className="px-6 pt-8 pb-5 text-center">

          {logoUrl && (
            <img
              src={logoUrl}
              className="w-28 mx-auto mb-5"
            />
          )}

          {photoUrl && (
            <img
              src={photoUrl}
              className="w-44 h-44 mx-auto rounded-[30px] border-[5px] border-orange-400 object-cover shadow-xl"
            />
          )}

          <h1 className="text-[42px] leading-tight font-black mt-6 text-[#0b1535] uppercase">
            {certificate?.studentName || student.studentName}
          </h1>

          {/* VERIFIED */}
          <div className="flex justify-center mt-4">

            <div className="flex items-center gap-2 px-5 py-2 rounded-full border border-green-600 bg-green-50">

              <CheckCircle className="text-green-600 w-5 h-5" />

              <span className="font-bold text-green-700">
                CERTIFICATE VERIFIED
              </span>

            </div>

          </div>

        </div>

        {/* COURSE */}
        <div className="px-7">

          <div className="flex items-start gap-4 mt-3">

            <div className="min-w-[55px] min-h-[55px] rounded-full border-2 border-yellow-500 flex items-center justify-center">

              <GraduationCap className="w-7 h-7 text-[#0b1535]" />

            </div>

            <div>

              <div className="text-[18px] font-medium text-gray-700">
                {
  certificate?.course ||
  student.courseName ||
  student.course ||
  "N/A"
}
              </div>

            </div>

          </div>

        </div>

        {/* INFO BOX */}
        <div className="mx-6 mt-7 border rounded-2xl overflow-hidden">

          {/* CERTIFICATE */}
          <div className="flex justify-between items-center gap-4 p-4 border-b">

            <div className="flex items-center gap-3">

              <FileBadge2 className="text-yellow-600" />

              <span className="font-semibold">
                Certificate No.
              </span>

            </div>

            <span className="text-right font-medium break-all">
              {certificate?.certificateNo || "N/A"}
            </span>

          </div>

          {/* DURATION */}
          {/* <div className="flex justify-between items-center gap-4 p-4 border-b">

            <div className="flex items-center gap-3">

              <Clock3 className="text-yellow-600" />

              <span className="font-semibold">
                Duration
              </span>

            </div>

            <span className="font-medium">
              {finalDuration}
            </span>

          </div> */}

          {/* ISSUE DATE */}
          <div className="flex justify-between items-center gap-4 p-4 border-b">

            <div className="flex items-center gap-3">

              <Calendar className="text-yellow-600" />

              <span className="font-semibold">
                Issue Date
              </span>

            </div>

            <span className="font-medium">
              {formatIssueDate(finalIssueDate)}
            </span>

          </div>

          {/* MARKS */}
          <div className="flex justify-between items-center gap-4 p-4 border-b">

            <div className="flex items-center gap-3">

              <Trophy className="text-yellow-600" />

              <span className="font-semibold">
                Marks
              </span>

            </div>

            <span className="font-medium">

              {isMultiple
                ? percentage
                  ? `${percentage}%`
                  : "N/A"
                : certificate?.marks || "N/A"}
  

            </span>

          </div>

          {/* GRADE */}
          <div className="flex justify-between items-center gap-4 p-4">

            <div className="flex items-center gap-3">

              <BadgeCheck className="text-yellow-600" />

              <span className="font-semibold">
                Grade
              </span>

            </div>

            <span className="font-medium">
             {
 certificate?.grade || "N/A"

}
            </span>

          </div>

        </div>

        {/* INSTITUTE */}
        <div className="px-6 mt-8">

          <div className="flex items-center gap-3 border-b pb-3">

            <div className="bg-[#0b1535] text-white w-12 h-12 rounded-full flex items-center justify-center">

              <School />

            </div>

            <h2 className="text-[22px] font-black text-[#0b1535]">
              INSTITUTE DETAILS
            </h2>

          </div>

        </div>

        {/* DETAILS */}
        <div className="mx-6 mt-5 mb-8 border rounded-2xl overflow-hidden">

          {/* Institute */}
          <div className="flex justify-between gap-4 p-4 border-b">

            <div className="flex items-center gap-3">

              <School className="text-yellow-600" />

              <span className="font-semibold">
                Institute
              </span>

            </div>

            <span className="font-medium text-right">
             {
  certificate?.instituteName ||
  student.instituteName ||
  "N/A"
}
            </span>

          </div>

          {/* Email */}
          <div className="flex justify-between gap-4 p-4 border-b">

            <div className="flex items-center gap-3">

              <Mail className="text-yellow-600" />

              <span className="font-semibold">
                Email
              </span>

            </div>

            <span className="font-medium text-right break-all">
              {franchise?.email || "N/A"}
            </span>

          </div>

          {/* Contact */}
          <div className="flex justify-between gap-4 p-4 border-b">

            <div className="flex items-center gap-3">

              <Phone className="text-yellow-600" />

              <span className="font-semibold">
                Contact
              </span>

            </div>

            <span className="font-medium">
              {franchise?.mobile || "N/A"}
            </span>

          </div>

          {/* Address */}
          <div className="flex justify-between gap-4 p-4">

            <div className="flex items-center gap-3">

              <MapPin className="text-yellow-600" />

              <span className="font-semibold">
                Address
              </span>

            </div>

            <span className="font-medium text-right">
              {franchise?.address || "N/A"}
            </span>

          </div>

        </div>

        {/* VERIFIED BOTTOM */}
        <div className="mx-6 mb-8 bg-green-50 border border-green-300 rounded-2xl p-5 flex gap-4">

          <div className="min-w-[50px]">

            <CheckCircle className="w-12 h-12 text-green-600" />

          </div>

          <div>

            <div className="font-bold text-green-700 text-lg">
              This certificate is verified and valid.
            </div>

            <div className="text-gray-600 text-sm mt-1">
              Information displayed is based on our records.
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}