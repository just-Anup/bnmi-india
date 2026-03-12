"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { databases } from "@/lib/appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = "student_admissions";
const BUCKET_ID = "6986e8a4001925504f6b";

export default function IDCard() {

    const { id } = useParams();
    const [student, setStudent] = useState(null);

    useEffect(() => {

        fetchStudent();

    }, []);

    const fetchStudent = async () => {

        const res = await databases.getDocument(
            DATABASE_ID,
            COLLECTION_ID,
            id
        );

        setStudent(res);

    };

    if (!student) return <div>Loading...</div>;

    return (

        <div className="flex justify-center">

            <div className="relative w-[350px]">

                {/* TEMPLATE */}

                <img
                    src="/idcard.jpeg"
                    className="w-full"
                />

                {/* PHOTO */}

                <img
                    src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${student.photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
                    className="absolute top-[190px] left-[120px] w-[100px] h-[100px] object-cover"
                />

                {/* DATA */}

                <div className="absolute top-[334px] left-[140px] text-lg">
                    {student.studentName}
                </div>

                <div className="absolute top-[365px] left-[140px] text-lg">
                    {student.courseName}
                </div>

                <div className="absolute top-[395px] left-[150px] text-lg">
                    {student.mobile}
                </div>

                <div className="absolute top-[480px] left-[40px] text-lg">
                    {student.referralCode}
                </div>

                <button
                    onClick={() => window.print()}
                    className="mt-6 bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Print
                </button>

            </div>

        </div>

    );

}