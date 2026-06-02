"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { Query, ID } from "appwrite";
import { useRouter } from "next/navigation";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = "student_admissions";

export default function ReAdmission() {

  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [allCourses, setAllCourses] = useState([]);

  const [installments, setInstallments] = useState([
    { name: "", amount: "", date: "" }
  ]);

  const [form, setForm] = useState({
    course: "",
    examType: "",
    courseFees: "",
    discountRate: "",
    discountAmount: "",
    totalFees: "",
    feesReceived: "",
    balance: "",
    remarks: "",
    batch: "",
    examFees: "",
    remainingSeats: "",
    admissionDate: ""
  });

 useEffect(() => {
  fetchStudents();
  fetchAllCourses();
}, []);


  const fetchStudents = async () => {

    const user = await account.get();

    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal("createdById", user.$id)]
    );

    setStudents(res.documents);

  };


  const fetchAllCourses = async () => {

  try {

    const user = await account.get();

    const [singleRes, multipleRes, beautyRes, semesterRes] =
      await Promise.all([

        databases.listDocuments(
          DATABASE_ID,
          "courses_single",
          [Query.equal("franchiseEmail", user.email)]
        ),

        databases.listDocuments(
          DATABASE_ID,
          "courses_multiple",
          [Query.equal("franchiseEmail", user.email)]
        ),

        databases.listDocuments(
          DATABASE_ID,
          "beauty_courses_single",
          [Query.equal("franchiseEmail", user.email)]
        ),

        databases.listDocuments(
          DATABASE_ID,
          "franchise_semester_courses",
          [Query.equal("franchiseEmail", user.email)]
        )

      ]);

    const courses = [
  ...singleRes.documents,
  ...multipleRes.documents,
  ...beautyRes.documents,
  ...semesterRes.documents
];

// remove duplicate course names
const uniqueCourses = courses.filter(
  (course, index, self) =>
    index ===
    self.findIndex(
      c => c.courseName === course.courseName
    )
);

setAllCourses(uniqueCourses);

    setAllCourses(courses);

  } catch (error) {

    console.log(error);

  }

};


const handleStudentSelect = async (id) => {

  const student = await databases.getDocument(
    DATABASE_ID,
    COLLECTION_ID,
    id
  );

  setSelectedStudent(student);

  setForm(prev => ({
    ...prev,
    batch: student.batch || ""
  }));

  const user = await account.get();

  // find all courses already taken by this student
  const oldAdmissions = await databases.listDocuments(
    DATABASE_ID,
    COLLECTION_ID,
    [
      Query.equal("studentName", student.studentName),
      Query.equal("mobile", student.mobile),
      Query.equal("createdById", user.$id)
    ]
  );

  const takenCourses = oldAdmissions.documents.map(
    item => item.course
  );

  setAllCourses(prev =>
    prev.filter(
      course =>
        !takenCourses.includes(course.courseName)
    )
  );
};


  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

  };


  const handleInstallmentChange = (index, field, value) => {

    const updated = [...installments];

    updated[index][field] = value;

    setInstallments(updated);

  };


  const addInstallment = () => {

    setInstallments([
      ...installments,
      { name: "", amount: "", date: "" }
    ]);

  };
  
const handleCourseSelect = (e) => {

  const selected = allCourses.find(
    c => c.$id === e.target.value
  );

  if (!selected) return;

  const total =
    Number(selected.courseFees || 0) +
    Number(selected.examFees || 0);

  setForm(prev => ({
    ...prev,

    course: selected.courseName,

    courseFees: selected.courseFees || 0,

    examFees: selected.examFees || 0,

    totalFees: total,

    balance: total
  }));
};


  const handleSubmit = async (e) => {

    e.preventDefault();

    const user = await account.get();

    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      {

        studentName: selectedStudent.studentName,
        fatherName: selectedStudent.fatherName,
        mobile: selectedStudent.mobile,
        email: selectedStudent.email,
        photoId: selectedStudent.photoId,
        signatureId: selectedStudent.signatureId,
        motherName: selectedStudent.motherName || "",
gender: selectedStudent.gender || "",
dob: selectedStudent.dob || "",
address: selectedStudent.address || "",
city: selectedStudent.city || "",
state: selectedStudent.state || "",
qualification: selectedStudent.qualification || "",
aadhaarNo: selectedStudent.aadhaarNo || "",

readmission: true,
oldAdmissionId: selectedStudent.$id,

        course: form.course,
        examType: form.examType,
        batch: form.batch,

        
        courseFees: Number(form.courseFees) || 0,
     discountRate: Number(form.discountRate) || 0,
        discountAmount: Number(form.discountAmount) || 0,
        totalFees: Number(form.totalFees) || 0,
        feesReceived: Number(form.feesReceived) || 0,
        balance: Number(form.balance) || 0,
        examFees: Number(form.examFees) || 0,
        remainingSeats: Number(form.remainingSeats) || 0,

        remarks: form.remarks,
        admissionDate: form.admissionDate,

        installments: JSON.stringify(installments),

        status: "Active",
        createdById: user.$id,
        createdByEmail: user.email,
        createdByName: user.name,
        createdAt: new Date().toISOString()

      }
    );
    alert("Re-Admission Successful");

    router.push("/login/institute/manage-student/admission");

  };


  return (

    <form onSubmit={handleSubmit} className="p-10 bg-gray-100 rounded-lg">

      <h2 className="text-2xl font-bold mb-6">RE-ADMISSION STUDENT</h2>

      {/* STUDENT SELECT */}

      <div className="grid grid-cols-3 gap-6 mb-8">

        <div>
          <label>Select Student</label>
          <select
            className="border p-2 w-full"
            onChange={(e) => handleStudentSelect(e.target.value)}
            required
          >
            <option value="">--select--</option>

            {students.map((s) => (
              <option key={s.$id} value={s.$id}>
                {s.studentName} ({s.mobile})
              </option>
            ))}

          </select>
        </div>


        <div>
          <label>Course of Interest *</label>
    <select
  onChange={handleCourseSelect}
  className="border p-2 w-full"
  required
>
  <option value="">Select Course</option>

  {allCourses.map((course) => (

    <option
      key={course.$id}
      value={course.$id}
    >
      {course.courseName}
    </option>

  ))}
</select>
        </div>


        <div>
          <label>Select Exam Type *</label>
          <select
            name="examType"
            onChange={handleChange}
            className="border p-2 w-full"
            required
          >
            <option value="">--select--</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
          </select>
        </div>

      </div>


      {/* FEES SECTION */}

      <div className="grid grid-cols-7 gap-4 mb-8">

        <div>
          <label>Course Fees</label>
          <input
  name="courseFees"
  value={form.courseFees}
  onChange={handleChange}
  className="border p-2 w-full"
/>
        </div>

        <div>
          <label>Discount Rate</label>
          <input name="discountRate" onChange={handleChange} className="border p-2 w-full" />
        </div>

        <div>
          <label>Discount Amount</label>
          <input name="discountAmount" onChange={handleChange} className="border p-2 w-full" />
        </div>

        <div>
          <label>Total Fees</label>
          <input
  name="totalFees"
  value={form.totalFees}
  onChange={handleChange}
  className="border p-2 w-full"
/>
        </div>

        <div>
          <label>Fees Received</label>
          <input name="feesReceived" onChange={handleChange} className="border p-2 w-full" />
        </div>

        <div>
          <label>Balance</label>
         <input
  name="balance"
  value={form.balance}
  onChange={handleChange}
  className="border p-2 w-full"
/>
        </div>

        <div>
          <label>Remarks</label>
          <input name="remarks" onChange={handleChange} className="border p-2 w-full" />
        </div>

      </div>


      {/* INSTALLMENTS */}

      <h3 className="font-semibold mb-2">Installment Details</h3>

      {installments.map((item, index) => (

        <div key={index} className="grid grid-cols-4 gap-4 mb-4">

          <div>
            <label>Installment Name</label>
            <input
              className="border p-2 w-full"
              onChange={(e) => handleInstallmentChange(index, "name", e.target.value)}
            />
          </div>

          <div>
            <label>Amount</label>
            <input
              className="border p-2 w-full"
              onChange={(e) => handleInstallmentChange(index, "amount", e.target.value)}
            />
          </div>

          <div>
            <label>Date</label>
            <input
              type="date"
              className="border p-2 w-full"
              onChange={(e) => handleInstallmentChange(index, "date", e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={addInstallment}
              className="bg-yellow-400 px-4 py-2 rounded"
            >
              + Add More
            </button>
          </div>

        </div>

      ))}


      {/* BATCH SECTION */}

      <div className="grid grid-cols-3 gap-6 mb-8">

        <div>
          <label>Exam Fees</label>
          <input
  name="examFees"
  value={form.examFees}
  onChange={handleChange}
  className="border p-2 w-full"
/>
        </div>

        <div>
          <label>Select Batch For Student *</label>
          <input
            name="batch"
            value={form.batch}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label>Remaining Seats For This Batch *</label>
          <input
            name="remainingSeats"
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>

      </div>


      <div className="mb-6">

        <label>Admission Date</label>

        <input
          type="date"
          name="admissionDate"
          onChange={handleChange}
          className="border p-2 w-full"
        />

      </div>


      <div className="flex gap-4">

        <button className="bg-blue-600 text-white px-6 py-2 rounded">
          Submit
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