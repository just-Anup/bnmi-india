"use client";

import { useState, useEffect } from "react";
import { databases, account } from "@/lib/appwrite";
import { ID, Storage, Client, Query } from "appwrite";
import { useRouter } from "next/navigation";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = "student_admissions";
const BUCKET_ID = "6986e8a4001925504f6b";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

const storage = new Storage(client);

export default function AddStudent() {

  const router = useRouter();

  const [photo, setPhoto] = useState(null);
  const [signature, setSignature] = useState(null);
  const [courses, setCourses] = useState([]);

  const [form, setForm] = useState({

    rollNumber: "",
    abbreviation: "Mr.",
    relationType: "S/O",
    studentName: "",
    surname: "",
    fatherName: "",
    motherName: "",

    courseType: "single",
    courseName: "",
    subjects: "",

    mobile: "",
    altMobile: "",
    email: "",
    dob: "",
    gender: "",

    state: "",
    city: "",
    postcode: "",
    address: "",
    aadhar: "",
    qualification: "",
    occupation: "",

    courseFees: 0,
    discount: 0,
    totalFees: 0,
    feesReceived: 0,
    balance: 0,
    examFees: 0,

    batch: "",
    admissionDate: "",
    remark: "",

    status: "Active"

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

  const getFranchiseInfo = async () => {

  const user = await account.get()

  const res = await databases.listDocuments(
    DATABASE_ID,
    "franchise_approved",
    [Query.equal("email", user.email)]
  )

  return {
    franchiseId: res.documents[0].$id,
    instituteName: res.documents[0].instituteName,
    userId: user.$id
  }

}
  

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

const handleFeesReceived = (value) => {

  const received = Number(value) || 0;

  const balance = (Number(form.totalFees) || 0) - received;

  setForm(prev => ({
    ...prev,
    feesReceived: received,
    balance
  }));

};

  const handleCourseChange = async (e) => {

  const courseId = e.target.value;

  const course = courses.find(c => c.$id === courseId);

  if (!course) return;

  let subjectsText = "";

  if (form.courseType === "single") {

    const res = await databases.listDocuments(
      DATABASE_ID,
      "course_subjects",
      [Query.equal("courseId", courseId)]
    );

    subjectsText = res.documents
      .map(s => s.subjectName)
      .join(", ");

  } else {

    subjectsText = course.subjects || "";

  }

  setForm({
    ...form,
    courseName: course.courseName || course.courseCode,
    subjects: subjectsText,
    courseFees: course.courseFees || 0,
    examFees: course.examFees || 0
  });

};
const handleChange = (e) => {
  setForm({ ...form, [e.target.name]: e.target.value });
};

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!form.courseName) {
      alert("Please select course");
      return;
    }

    if (!form.subjects) {
      alert("Please enter subjects");
      return;
    }

    try {

      const user = await account.get();

      let photoId = "";
      let signatureId = "";

      if (photo) {
        const res = await storage.createFile(
          BUCKET_ID,
          ID.unique(),
          photo
        );
        photoId = res.$id;
      }

      if (signature) {
        const res = await storage.createFile(
          BUCKET_ID,
          ID.unique(),
          signature
        );
        signatureId = res.$id;
      }

      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          ...form,
          subjects: form.subjects,
          createdById: user.$id,
          createdByEmail: user.email,
              franchiseEmail: user.email, 
          photoId,
          signatureId,
          createdAt: new Date().toISOString(),
          franchiseId: franchise.franchiseId,
          instituteName: franchise.instituteName,
          createdById: franchise.userId,
          createdAt: new Date().toISOString()
        }
      );

      alert("Student Registered Successfully");

      router.push("/login/institute/manage-student/admission");

    } catch (err) {
      console.log(err);
      alert(err.message);
    }

  };

  return (

    <form onSubmit={handleSubmit} className="p-10 bg-gray-100 rounded">

      <h1 className="text-2xl font-bold mb-6">
        ADD NEW STUDENT
      </h1>

      {/* Photo Section */}

      <div className="grid grid-cols-3 gap-6 mb-6">

        <div>
          <label className="block mb-1 font-semibold">
            Student Photo *
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files[0])}
            className="border p-2 w-full"
            required
          />

        </div>

        <div>

          <label className="block mb-1 font-semibold">
            Student Signature *
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSignature(e.target.files[0])}
            className="border p-2 w-full"
            required
          />

        </div>

        <div>

          <label className="block mb-1 font-semibold">
            Roll Number
          </label>

          <input
            name="rollNumber"
            value={form.rollNumber}
            onChange={handleChange}
            className="border p-2 w-full"
          />

        </div>

      </div>

      {/* Student Info */}

      <div className="grid grid-cols-3 gap-6 mb-6">

        <div>

          <label className="block mb-1 font-semibold">
            Abbreviation
          </label>

          <select
            name="abbreviation"
            value={form.abbreviation}
            onChange={handleChange}
            className="border p-2 w-full"
          >

            <option>Mr.</option>
            <option>Mrs.</option>
            <option>Miss</option>

          </select>

        </div>

        <div>

          <label className="block mb-1 font-semibold">
            Student Name *
          </label>

          <input
            name="studentName"
            value={form.studentName}
            onChange={handleChange}
            className="border p-2 w-full"
          />

        </div>

        <div>

          <label className="block mb-1 font-semibold">
            Relation Type
          </label>

          <select
            name="relationType"
            value={form.relationType}
            onChange={handleChange}
            className="border p-2 w-full"
          >

            <option>S/O</option>
            <option>D/O</option>
            <option>W/O</option>

          </select>

        </div>

        <div>

          <label className="block mb-1 font-semibold">
            Father / Husband Name
          </label>

          <input
            name="fatherName"
            value={form.fatherName}
            onChange={handleChange}
            className="border p-2 w-full"
          />

        </div>

        <div>

          <label className="block mb-1 font-semibold">
            Surname
          </label>

          <input
            name="surname"
            value={form.surname}
            onChange={handleChange}
            className="border p-2 w-full"
          />

        </div>

        <div>

          <label className="block mb-1 font-semibold">
            Mother Name
          </label>

          <input
            name="motherName"
            value={form.motherName}
            onChange={handleChange}
            className="border p-2 w-full"
          />

        </div>

      </div>

      {/* Course Type */}

      <div className="flex gap-3 mb-6">

        <button
          type="button"
          onClick={() => {
            setForm({ ...form, courseType: "single" });
            loadCourses("single");
          }}
          className={`px-4 py-2 rounded ${form.courseType === "single" ? "bg-blue-600 text-white" : "bg-gray-300"}`}
        >
          Single
        </button>

        <button
          type="button"
          onClick={() => {
            setForm({ ...form, courseType: "multiple" });
            loadCourses("multiple");
          }}
          className={`px-4 py-2 rounded ${form.courseType === "multiple" ? "bg-blue-600 text-white" : "bg-gray-300"}`}
        >
          Multiple
        </button>

        <button
          type="button"
          onClick={() => {
            setForm({ ...form, courseType: "typing" });
            loadCourses("typing");
          }}
          className={`px-4 py-2 rounded ${form.courseType === "typing" ? "bg-blue-600 text-white" : "bg-gray-300"}`}
        >
          Typing
        </button>

      </div>

      {/* Course */}

      <div className="grid grid-cols-3 gap-6 mb-6">

        <div>

          <label className="block mb-1 font-semibold">
            Course
          </label>

          <select
            name="courseName"
            value={form.courseName}
            onChange={handleCourseChange}
            className="border p-2 w-full"
          >
            <option value="">Select Course</option>

            {courses.map((course) => (

              <option
                key={course.$id}
                value={course.$id}
              >
                {course.courseName || course.courseCode}

              </option>

            ))}

          </select>

        </div>

        <div>

          <label className="block mb-1 font-semibold">
            Subjects (comma separated)
          </label>

          <input
            name="subjects"
            value={form.subjects}
            readOnly
            className="border p-2 w-full bg-gray-100"
          />

        </div>

        <div>

          <label className="block mb-1 font-semibold">
            Student Mobile
          </label>

          <input
            name="mobile"
            value={form.mobile}
            onChange={handleChange}
            className="border p-2 w-full"
          />

        </div>

        <div>

          <label className="block mb-1 font-semibold">
            Alternate Mobile
          </label>

          <input
            name="altMobile"
            value={form.altMobile}
            onChange={handleChange}
            className="border p-2 w-full"
          />

        </div>

        <div>

          <label className="block mb-1 font-semibold">
            Email
          </label>

          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            className="border p-2 w-full"
          />

        </div>

        <div>

          <label className="block mb-1 font-semibold">
            Date Of Birth
          </label>

          <input
            type="date"
            name="dob"
            value={form.dob}
            onChange={handleChange}
            className="border p-2 w-full"
          />

        </div>

        <div>

          <label className="block mb-1 font-semibold">
            Aadhar
          </label>

          <input
            name="aadhar"
            value={form.aadhar}
            onChange={handleChange}
            className="border p-2 w-full"
          />

        </div>

        <div>

          <label className="block mb-1 font-semibold">
            qualification
          </label>

          <input
            name="qualification"
            value={form.qualification}
            onChange={handleChange}
            className="border p-2 w-full"
          />

        </div>

        <div>

          <label className="block mb-1 font-semibold">
            occupation
          </label>

          <input
            name="occupation"
            value={form.occupation}
            onChange={handleChange}
            className="border p-2 w-full"
          />

        </div>



      </div>

      {/* Fees Section */}

      <div className="grid grid-cols-6 gap-4 border p-4 mb-6 bg-white">

        <div>

          <label className="block mb-1 font-semibold">
            Course Fees
          </label>

          <input
            type="number"
            value={form.courseFees}
            onChange={(e) => calculateFees(e.target.value, form.discount)}
            className="border p-2 w-full"
          />

        </div>

        <div>

          <label className="block mb-1 font-semibold">
            Discount
          </label>

          <input
            type="number"
            value={form.discount}
            onChange={(e) => calculateFees(form.courseFees, e.target.value)}
            className="border p-2 w-full"
          />

        </div>

        <div>

          <label className="block mb-1 font-semibold">
            Total Fees
          </label>

          <input
            value={form.totalFees}
            readOnly
            className="border p-2 bg-gray-200 w-full"
          />

        </div>

        <div>

          <label className="block mb-1 font-semibold">
            Fees Received
          </label>

          <input
            type="number"
            value={form.feesReceived}
            onChange={(e) => handleFeesReceived(e.target.value)}
            className="border p-2 w-full"
          />

        </div>

        <div>

          <label className="block mb-1 font-semibold">
            Balance
          </label>

          <input
            value={form.balance}
            readOnly
            className="border p-2 bg-gray-200 w-full"
          />

        </div>

        <div>

          <label className="block mb-1 font-semibold">
            Exam Fees
          </label>

          <input
            name="examFees"
            value={form.examFees}
            onChange={handleChange}
            className="border p-2 w-full"
          />

        </div>

      </div>

      {/* Admission Date */}

      <div className="grid grid-cols-3 gap-6 mb-6">

        <div>

          <label className="block mb-1 font-semibold">
            Admission Date
          </label>

          <input
            type="date"
            name="admissionDate"
            value={form.admissionDate}
            onChange={handleChange}
            className="border p-2 w-full"
          />

        </div>

        <div>

          <label className="block mb-1 font-semibold">
            Batch
          </label>

          <input
            name="batch"
            value={form.batch}
            onChange={handleChange}
            className="border p-2 w-full"
          />

        </div>

        <div>

          <label className="block mb-1 font-semibold">
            Remark
          </label>

          <textarea
            name="remark"
            value={form.remark}
            onChange={handleChange}
            className="border p-2 w-full"
          />

        </div>

      </div>

      <div className="flex gap-4">

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded"
        >
          Register Admission
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="bg-red-500 text-white px-6 py-2 rounded"
        >
          Cancel
        </button>

      </div>

    </form>

  );

}