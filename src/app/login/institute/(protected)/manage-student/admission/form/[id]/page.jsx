"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { databases } from "@/lib/appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = "student_admissions";
const BUCKET_ID = "6986e8a4001925504f6b";

export default function AdmissionForm() {

    const { id } = useParams();
    const [student, setStudent] = useState(null);

    useEffect(() => {
        if (id) fetchStudent();
    }, [id]);

    const fetchStudent = async () => {

        try {

            const res = await databases.getDocument(
                DATABASE_ID,
                COLLECTION_ID,
                id
            );

            setStudent(res);

        } catch (error) {
            console.log("Error loading student:", error);
        }

    };

    if (!student) {
        return <div className="p-10">Loading...</div>;
    }

    return (

        <div className="flex justify-center p-10 bg-gray-100">

            <div className="relative w-[900px] bg-white shadow">

                {/* TEMPLATE */}

                <img
                    src="/admi.png"
                    className="w-full"
                    alt="Admission Template"
                />

                {/* ADMISSION DATE */}

                <div className="absolute top-[320px] left-[260px] text-lg">
                    {student.admissionDate || ""}
                </div>

                {/* STUDENT NAME */}

                <div className="absolute top-[365px] left-[210px] text-lg">
                    {student.studentName || ""}
                </div>

                {/* FATHER NAME */}

                <div className="absolute top-[408px] left-[210px] text-lg">
                    {student.fatherName || ""}
                </div>

                {/* MOTHER NAME */}

                <div className="absolute top-[450px] left-[210px] text-lg">
                    {student.motherName || ""}
                </div>

                {/* MOBILE */}

                <div className="absolute top-[496px] left-[220px] text-lg">
                    {student.mobile || ""}
                </div>

                {/* ALT MOBILE */}

                <div className="absolute top-[496px] left-[620px] text-lg">
                    {student.altMobile || ""}
                </div>

                {/* AADHAR */}

                <div className="absolute top-[537px] left-[260px] text-lg">
                    {student.aadhar || ""}
                </div>

                {/* EMAIL */}

                <div className="absolute top-[580px] left-[170px] text-lg">
                    {student.email || ""}
                </div>

                {/* QUALIFICATION */}

                <div className="absolute top-[625px] left-[230px] text-lg">
                    {student.qualification || ""}
                </div>

                {/* GENDER */}

                <div className="absolute top-[624px] left-[230px] text-lg">
                    {student.gender || ""}
                </div>

                {/* ADDRESS */}

                <div className="absolute top-[674px] left-[250px] w-[600px] text-lg">
                    {student.address || ""}
                </div>

                {/* SIGNATURE */}

                {student.signatureId && (

                    <img
                        src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.signatureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
                        className="absolute top-[760px] left-[250px] w-[80px] h-[40px]"
                        alt="Student Signature"
                    />

                )}

                {/* COURSE FEES */}

                <div className="absolute top-[890px] left-[200px] text-lg">
                    {student.courseFees || ""}
                </div>

                {/* PAID FEES */}

                <div className="absolute top-[890px] left-[450px] text-lg">
                    {student.feesReceived || ""}
                </div>

                {/* BALANCE */}

                <div className="absolute top-[890px] left-[690px] text-lg">
                    {student.balance || ""}
                </div>

                {/* BATCH */}

                <div className="absolute top-[955px] left-[200px] text-lg">
                    {student.batch || ""}
                </div>

                {/* REGISTERED PERSON */}

                <div className="absolute top-[955px] left-[520px] text-lg">
                    {student.createdByName || ""}
                </div>

                {/* PRINT BUTTON */}

                <div className="text-center mt-10">

                    <button
                        onClick={() => window.print()}
                        className="bg-blue-600 text-white px-6 py-2 rounded"
                    >
                        Print Admission Form
                    </button>

                </div>

            </div>

        </div>

    );

}