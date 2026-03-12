"use client";

import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";
import { useParams, useRouter } from "next/navigation";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = "student_admissions";

export default function EditStudent() {

    const { id } = useParams();
    const router = useRouter();

    const [form, setForm] = useState({
        studentName: "",
        fatherName: "",
        motherName: "",
        mobile: "",
        altMobile: "",
        email: "",
        dob: "",
        gender: "",
        state: "",
        city: "",
        postcode: "",
        address: "",
        courseName: "",
        courseFees: 0,
        discount: 0,
        totalFees: 0,
        feesReceived: 0,
        balance: 0,
        batch: "",
        admissionDate: "",
        remark: ""
    });

    useEffect(() => {

        fetchStudent();

    }, []);

    const fetchStudent = async () => {

        const res = await databases.getDocument(
            DATABASE_ID,
            COLLECTION_ID,
            id
        );

        setForm(res);

    };

    const handleChange = (e) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value
        });

    };

    const calculateFees = (courseFees, discount) => {

        const fees = Number(courseFees) || 0;
        const disc = Number(discount) || 0;

        const total = fees - disc;

        setForm(prev => ({
            ...prev,
            courseFees: fees,
            discount: disc,
            totalFees: total
        }));

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            await databases.updateDocument(
                DATABASE_ID,
                COLLECTION_ID,
                id,
                {

                    ...form,

                    courseFees: Number(form.courseFees) || 0,
                    discount: Number(form.discount) || 0,
                    totalFees: Number(form.totalFees) || 0,
                    feesReceived: Number(form.feesReceived) || 0,
                    balance: Number(form.balance) || 0

                }
            );

            alert("Student Updated Successfully");

            router.push("/login/institute/manage-student/admission");

        } catch (err) {

            console.log(err);
            alert("Update failed");

        }

    };

    return (

        <form onSubmit={handleSubmit} className="p-10 bg-gray-100">

            <h1 className="text-2xl font-bold mb-6">
                Edit Student Admission
            </h1>

            <div className="grid grid-cols-3 gap-6">

                <input
                    name="studentName"
                    value={form.studentName || ""}
                    placeholder="Student Name"
                    onChange={handleChange}
                    className="border p-2"
                />

                <input
                    name="fatherName"
                    value={form.fatherName || ""}
                    placeholder="Father Name"
                    onChange={handleChange}
                    className="border p-2"
                />

                <input
                    name="motherName"
                    value={form.motherName || ""}
                    placeholder="Mother Name"
                    onChange={handleChange}
                    className="border p-2"
                />

                <input
                    name="mobile"
                    value={form.mobile || ""}
                    placeholder="Mobile"
                    onChange={handleChange}
                    className="border p-2"
                />

                <input
                    name="altMobile"
                    value={form.altMobile || ""}
                    placeholder="Alternate Mobile"
                    onChange={handleChange}
                    className="border p-2"
                />

                <input
                    name="email"
                    value={form.email || ""}
                    placeholder="Email"
                    onChange={handleChange}
                    className="border p-2"
                />

                <input
                    name="courseName"
                    value={form.courseName || ""}
                    placeholder="Course"
                    onChange={handleChange}
                    className="border p-2"
                />

                <input
                    type="number"
                    name="courseFees"
                    value={form.courseFees || 0}
                    placeholder="Course Fees"
                    onChange={(e) => calculateFees(e.target.value, form.discount)}
                    className="border p-2"
                />

                <input
                    type="number"
                    name="discount"
                    value={form.discount || 0}
                    placeholder="Discount"
                    onChange={(e) => calculateFees(form.courseFees, e.target.value)}
                    className="border p-2"
                />

                <input
                    value={form.totalFees || 0}
                    readOnly
                    className="border p-2 bg-gray-200"
                />

                <input
                    type="number"
                    name="feesReceived"
                    value={form.feesReceived || 0}
                    placeholder="Fees Received"
                    onChange={handleChange}
                    className="border p-2"
                />

                <input
                    type="number"
                    name="balance"
                    value={form.balance || 0}
                    placeholder="Balance"
                    onChange={handleChange}
                    className="border p-2"
                />

                <input
                    name="batch"
                    value={form.batch || ""}
                    placeholder="Batch"
                    onChange={handleChange}
                    className="border p-2"
                />

                <input
                    type="date"
                    name="admissionDate"
                    value={form.admissionDate || ""}
                    onChange={handleChange}
                    className="border p-2"
                />

                <textarea
                    name="remark"
                    value={form.remark || ""}
                    placeholder="Remark"
                    onChange={handleChange}
                    className="border p-2 col-span-3"
                />

            </div>

            <div className="mt-6 text-center">

                <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-3 rounded"
                >
                    Update Student
                </button>

            </div>

        </form>

    );

}