"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { useRouter } from "next/navigation";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = "student_enquiries";

export default function AddEnquiry() {


  const router = useRouter();

  const [courses, setCourses] = useState([]);

  const [form, setForm] = useState({
    abbreviation: "Mr.",
    studentName: "",
    relationType: "S/O",
    fatherName: "",
    surname: "",
    motherName: "",
    courseType: "single",
    courseInterested: "",
    mobile: "",
    alternateMobile: "",
    email: "",
    dob: "",
    gender: "",
    state: "",
    city: "",
    postcode: "",
    address: "",
    remark: "",
    enquiryDate: ""
  });

  useEffect(() => {
    loadCourses("single");
  }, []);

  const loadCourses = async (type) => {

    const user = await account.get();

    let collection = "";
    let queries = [];

    if (type === "single") {
      collection = "courses_single";
      queries = [Query.equal("franchiseEmail", user.email)];
    }

    if (type === "multiple") {
      collection = "franchise_multiple_courses";
      queries = [Query.equal("franchiseEmail", user.email)];
    }

    if (type === "typing") {
      collection = "franchise_typing_courses";
      queries = [Query.equal("franchiseEmail", user.email)];
    }

    const res = await databases.listDocuments(
      DATABASE_ID,
      collection,
      queries
    );

    setCourses(res.documents);
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const selectCourseType = (type) => {
    setForm({ ...form, courseType: type });
    loadCourses(type);
  };

  const saveEnquiry = async (e) => {
    e.preventDefault();

    try {

      const user = await account.get();

      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          ...form,
          franchiseEmail: user.email,
          createdById: user.$id,
          status: "Pending"
        }
      );

      alert("Enquiry saved successfully");

      router.push("/login/institute/manage-student/enquiry");

    } catch (err) {

      console.log("Save enquiry error:", err);
      alert(err.message);

    }
  };

  return (

    <div className="p-10 bg-gray-100 min-h-screen">

      <h1 className="text-2xl font-bold mb-6">
        ADD NEW STUDENT ENQUIRY
      </h1>

      <form onSubmit={saveEnquiry} className="grid grid-cols-2 gap-4 bg-white p-6 rounded shadow">

        <select name="abbreviation" onChange={handleChange} className="border p-2">
          <option>Mr.</option>
          <option>Mrs.</option>
          <option>Miss</option>
        </select>

        <input name="studentName" placeholder="Student Name" onChange={handleChange} className="border p-2" />

        <select name="relationType" onChange={handleChange} className="border p-2">
          <option>S/O</option>
          <option>D/O</option>
          <option>W/O</option>
        </select>

        <input name="fatherName" placeholder="Father/Husband Name" onChange={handleChange} className="border p-2" />

        <input name="surname" placeholder="Surname" onChange={handleChange} className="border p-2" />

        <input name="motherName" placeholder="Mother Name" onChange={handleChange} className="border p-2" />

        <div className="col-span-2 flex gap-3">

          <button type="button" onClick={() => selectCourseType("single")} className="bg-blue-600 text-white px-4 py-2 rounded">
            Single
          </button>

          <button type="button" onClick={() => selectCourseType("multiple")} className="bg-blue-600 text-white px-4 py-2 rounded">
            Multiple
          </button>

          <button type="button" onClick={() => selectCourseType("typing")} className="bg-blue-600 text-white px-4 py-2 rounded">
            Typing
          </button>

        </div>

        <select name="courseInterested" onChange={handleChange} className="border p-2 col-span-2">

          <option>Select Course</option>

          {courses.map(course => (
            <option key={course.$id} value={course.courseCode || course.courseName}>
              {course.courseName || course.courseCode}
            </option>
          ))}

        </select>

        <input name="mobile" placeholder="Student Mobile" onChange={handleChange} className="border p-2" />

        <input name="alternateMobile" placeholder="Alternate Mobile" onChange={handleChange} className="border p-2" />

        <input name="email" placeholder="Email" onChange={handleChange} className="border p-2" />

        <input type="date" placeholder="Date Of Birth" name="dob" onChange={handleChange} className="border p-2" />

        <select name="gender" onChange={handleChange} className="border p-2">
          <option value="">Select Gender</option>
          <option>Male</option>
          <option>Female</option>
        </select>

        <input name="state" placeholder="State" onChange={handleChange} className="border p-2" />

        <input name="city" placeholder="City" onChange={handleChange} className="border p-2" />

        <input name="postcode" placeholder="Postcode" onChange={handleChange} className="border p-2" />

        <textarea name="address" placeholder="Permanent Address" onChange={handleChange} className="border p-2 col-span-2" />

        <input type="date" name="enquiryDate" onChange={handleChange} className="border p-2" />

        <textarea name="remark" placeholder="Remark" onChange={handleChange} className="border p-2" />

        <div className="col-span-2 flex gap-4">

          <button className="bg-blue-600 text-white px-6 py-2 rounded">
            Save Admission
          </button>

          <button type="button" onClick={() => router.push("/login/institute/manage-student")} className="bg-red-500 text-white px-6 py-2 rounded">
            Cancel
          </button>

        </div>

      </form>

    </div>

  );

}