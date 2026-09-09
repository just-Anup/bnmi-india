
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
  const [loading, setLoading] = useState(false);

  const [installments, setInstallments] = useState([
    {
      name: "",
      amount: "",
      date: "",
    },
  ]);

  const [form, setForm] = useState({
    course: "",
    courseName: "",
    courseDisplayName: "",
    courseId: "",
    courseCode: "",
    courseType: "",

    subjects: "",
    selectedSubjectIds: "",

    examType: "",

    courseFees: "",
    discount: 0,
    totalFees: "",
    feesReceived: "",
    balance: "",

    remarks: "",
    batch: "",
    examFees: "",

    remainingSeats: "",
    admissionDate: "",
  });

  // =========================================================
  // LOAD STUDENTS + COURSES
  // =========================================================

  useEffect(() => {
    fetchStudents();
    fetchAllCourses();
  }, []);

  // =========================================================
  // FETCH STUDENTS
  // =========================================================

  const fetchStudents = async () => {
    try {
      const user = await account.get();

      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal("createdById", user.$id),
          Query.orderDesc("createdAt"),
          Query.limit(100),
        ]
      );

      setStudents(res.documents);
    } catch (error) {
      console.error("FETCH STUDENTS ERROR:", error);
      alert(error?.message || "Unable to load students");
    }
  };

  // =========================================================
  // FETCH ALL COURSES
  // =========================================================

  const fetchAllCourses = async () => {
    try {
      const user = await account.get();

      const [
        singleRes,
        multipleRes,
        beautyRes,
        semesterRes,
      ] = await Promise.all([
        // SAME COLLECTION AS YOUR NORMAL ADMISSION PAGE
        databases.listDocuments(
          DATABASE_ID,
          "courses_single",
          [Query.equal("franchiseEmail", user.email)]
        ),

        // SAME COLLECTION AS YOUR NORMAL ADMISSION PAGE
        databases.listDocuments(
          DATABASE_ID,
          "franchise_multiple_courses",
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
        ),
      ]);

      const courses = [
        ...singleRes.documents.map((course) => ({
          ...course,
          courseType: "single",
        })),

        ...multipleRes.documents.map((course) => ({
          ...course,
          courseType: "multiple",
        })),

        ...beautyRes.documents.map((course) => ({
          ...course,
          courseType: "beauty",
        })),

        ...semesterRes.documents.map((course) => ({
          ...course,
          courseType: "semester",
        })),
      ];

      // Remove duplicates by collection + ID
      const uniqueCourses = courses.filter(
        (course, index, self) =>
          index ===
          self.findIndex(
            (c) =>
              c.$id === course.$id &&
              c.courseType === course.courseType
          )
      );

      setAllCourses(uniqueCourses);
    } catch (error) {
      console.error("FETCH COURSES ERROR:", error);
      alert(error?.message || "Unable to load courses");
    }
  };

  // =========================================================
  // SELECT STUDENT
  // =========================================================

  const handleStudentSelect = async (id) => {
    try {
      if (!id) {
        setSelectedStudent(null);
        return;
      }

      const student = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        id
      );

      setSelectedStudent(student);

      // Keep existing batch as default
      setForm((prev) => ({
        ...prev,
        batch: student.batch || "",
      }));

      console.log("SELECTED STUDENT:", student);
    } catch (error) {
      console.error("STUDENT SELECT ERROR:", error);
      alert(error?.message || "Unable to load student");
    }
  };

  // =========================================================
  // NORMAL INPUT CHANGE
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // INSTALLMENTS
  // =========================================================

  const handleInstallmentChange = (index, field, value) => {
    const updated = [...installments];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setInstallments(updated);
  };

  const addInstallment = () => {
    setInstallments((prev) => [
      ...prev,
      {
        name: "",
        amount: "",
        date: "",
      },
    ]);
  };

  // =========================================================
  // COURSE SELECT
  // =========================================================

  const handleCourseSelect = async (e) => {
    try {
      const courseId = e.target.value;

      if (!courseId) {
        setForm((prev) => ({
          ...prev,
          course: "",
          courseName: "",
          courseDisplayName: "",
          courseId: "",
          courseCode: "",
          courseType: "",
          subjects: "",
          selectedSubjectIds: "",
          courseFees: "",
          examFees: "",
          totalFees: "",
          balance: "",
        }));

        return;
      }

      const selected = allCourses.find(
        (course) => course.$id === courseId
      );

      if (!selected) {
        console.error("COURSE NOT FOUND");
        return;
      }

      console.log("SELECTED COURSE:", selected);

      let subjectsText = "";
      let selectedSubjectIds = "";

      // =====================================================
      // SINGLE / BEAUTY SUBJECTS
      // =====================================================

      if (
        selected.courseType === "single" ||
        selected.courseType === "beauty"
      ) {
        const subjectCollection =
          selected.courseType === "beauty"
            ? "beauty_courses_subjects"
            : "course_subjects";

        try {
          const subjectRes = await databases.listDocuments(
            DATABASE_ID,
            subjectCollection,
            [Query.equal("courseId", selected.$id)]
          );

          subjectsText = subjectRes.documents
            .map((subject) => subject.subjectName)
            .join(", ");

          selectedSubjectIds = subjectRes.documents
            .map((subject) => subject.$id)
            .join("||");
        } catch (subjectError) {
          console.log(
            "SUBJECT LOAD ERROR:",
            subjectError
          );
        }
      }

      // =====================================================
      // MULTIPLE COURSE
      // =====================================================

      if (selected.courseType === "multiple") {
        subjectsText = selected.subjects || "";
      }

      // =====================================================
      // SEMESTER COURSE
      // =====================================================

      if (selected.courseType === "semester") {
        try {
          const subjectRes =
            await databases.listDocuments(
              DATABASE_ID,
              "franchise_semester_course_subjects",
              [
                Query.equal(
                  "courseCode",
                  selected.courseCode
                ),
                Query.equal(
                  "semesterNumber",
                  1
                ),
                Query.equal(
                  "franchiseEmail",
                  (await account.get()).email
                ),
              ]
            );

          subjectsText = subjectRes.documents
            .map((subject) => subject.subjectName)
            .join(", ");

          selectedSubjectIds = subjectRes.documents
            .map((subject) => subject.subjectId)
            .join("||");
        } catch (semesterError) {
          console.log(
            "SEMESTER SUBJECT ERROR:",
            semesterError
          );
        }
      }

      // =====================================================
      // FEES
      // =====================================================

      const courseFees = Number(
        selected.courseFees || 0
      );

      const examFees = Number(
        selected.examFees || 0
      );

      const totalFees =
        courseFees + examFees;

      // =====================================================
      // SET FORM
      // =====================================================

      setForm((prev) => ({
        ...prev,

        course: selected.courseName || selected.$id,

        courseName:
          selected.courseName ||
          selected.courseCode ||
          "",

        courseDisplayName:
          selected.courseName ||
          selected.courseCode ||
          "",

        courseId: selected.$id,

        courseCode:
          selected.courseCode || "",

        courseType:
          selected.courseType || "single",

        subjects: subjectsText,

        selectedSubjectIds,

        courseFees,

        examFees,

        totalFees,

        balance:
          totalFees -
          Number(prev.feesReceived || 0),

        batch:
          prev.batch ||
          selected.batch ||
          "",
      }));
    } catch (error) {
      console.error(
        "COURSE SELECT ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to select course"
      );
    }
  };

  // =========================================================
  // SUBMIT RE-ADMISSION
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!selectedStudent) {
      alert("Please select student");
      return;
    }

    if (!form.courseId) {
      alert("Please select course");
      return;
    }

    setLoading(true);

    try {
      const user = await account.get();

      // =====================================================
      // CHECK IF STUDENT ALREADY HAS THIS COURSE
      // =====================================================

      const existingAdmissions =
        await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID,
          [
            Query.equal(
              "createdById",
              user.$id
            ),
            Query.equal(
              "mobile",
              selectedStudent.mobile
            ),
            Query.equal(
              "courseId",
              form.courseId
            ),
            Query.limit(100),
          ]
        );

      if (
        existingAdmissions.documents.length > 0
      ) {
        alert(
          "This student is already admitted to this course."
        );

        setLoading(false);
        return;
      }

      // =====================================================
      // FEES
      // =====================================================

      const courseFees =
        Number(form.courseFees || 0);

      const discount =
        Number(form.discount || 0);

      const totalFees =
        Number(form.totalFees || 0);

      const feesReceived =
        Number(form.feesReceived || 0);

      const balance =
        totalFees - feesReceived;

      // =====================================================
      // ADMISSION DATE
      // =====================================================

      const admissionDate =
        form.admissionDate ||
        new Date()
          .toISOString()
          .split("T")[0];

      // =====================================================
      // CREATE NEW ADMISSION
      //
      // IMPORTANT:
      // Same field naming structure as your
      // normal Add Admission page.
      // =====================================================

      const finalData = {
        // ---------------------------------------------------
        // STUDENT INFORMATION
        // ---------------------------------------------------

        rollNumber:
          selectedStudent.rollNumber || "",

        abbreviation:
          selectedStudent.abbreviation || "Mr.",

        relationType:
          selectedStudent.relationType || "S/O",

        studentName:
          selectedStudent.studentName || "",

        surname:
          selectedStudent.surname || "",

        fatherName:
          selectedStudent.fatherName || "",

        motherName:
          selectedStudent.motherName || "",

        showFatherInCertificate:
          selectedStudent.showFatherInCertificate ||
          false,

        showMotherInCertificate:
          selectedStudent.showMotherInCertificate ||
          false,

        mobile:
          selectedStudent.mobile || "",

        altMobile:
          selectedStudent.altMobile || "",

        email:
          selectedStudent.email || "",

        dob:
          selectedStudent.dob || "",

        gender:
          selectedStudent.gender || "",

        state:
          selectedStudent.state || "",

        city:
          selectedStudent.city || "",

        postcode:
          selectedStudent.postcode || "",

        address:
          selectedStudent.address || "",

        aadhar:
          selectedStudent.aadhar ||
          selectedStudent.aadhaarNo ||
          "",

        qualification:
          selectedStudent.qualification || "",

        occupation:
          selectedStudent.occupation || "",

        // ---------------------------------------------------
        // REUSE EXISTING PHOTO + SIGNATURE
        // ---------------------------------------------------

        photoId:
          selectedStudent.photoId || "",

        signatureId:
          selectedStudent.signatureId || "",

        // ---------------------------------------------------
        // NEW COURSE
        // ---------------------------------------------------

        courseType:
          form.courseType || "single",

        courseName:
          form.courseDisplayName ||
          form.courseName ||
          form.course,

        courseId:
          form.courseId,

        courseCode:
          form.courseCode || "",

        courseDisplayName:
          form.courseDisplayName ||
          form.courseName ||
          form.course,

        subjects:
          form.subjects || "",

        selectedSubjectIds:
          form.selectedSubjectIds || "",

        // ---------------------------------------------------
        // SEMESTER
        // ---------------------------------------------------

        currentSemester: 1,

        completedSemester: 0,

        totalSemesters:
          Number(
            selectedStudent.totalSemesters ||
              0
          ),

        courseStatus: "Active",

        // ---------------------------------------------------
        // FEES
        // ---------------------------------------------------

        courseFees,

        discount,

        totalFees,

        feesReceived,

        balance,

        examFees:
          Number(form.examFees || 0),

        // ---------------------------------------------------
        // OTHER DETAILS
        // ---------------------------------------------------

        batch:
          form.batch ||
          selectedStudent.batch ||
          "",

        admissionDate,

        remark:
          form.remarks || "",

        status: "Active",

        // ---------------------------------------------------
        // RE-ADMISSION TRACKING
        // ---------------------------------------------------

        

        // ---------------------------------------------------
        // INSTALLMENTS
        // ---------------------------------------------------

        installments:
          JSON.stringify(installments),

        // ---------------------------------------------------
        // FRANCHISE INFORMATION
        // Same structure as Add Admission
        // ---------------------------------------------------

        franchiseEmail:
          user.email,

        franchiseId:
          selectedStudent.franchiseId ||
          "",

        instituteName:
          selectedStudent.instituteName ||
          "",

        createdById:
          user.$id,

        createdByName:
          selectedStudent.instituteName ||
          user.name ||
          "",

        createdAt:
          new Date().toISOString(),
      };

      console.log(
        "CREATING RE-ADMISSION:",
        finalData
      );

      // =====================================================
      // CREATE DOCUMENT
      // =====================================================

      const created =
        await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID,
          ID.unique(),
          finalData
        );

      console.log(
        "RE-ADMISSION CREATED:",
        created
      );

      alert(
        "Re-Admission Successful"
      );

      // =====================================================
      // GO BACK TO ADMISSION LIST
      // =====================================================

      router.push(
        "/login/institute/manage-student/admission"
      );
    } catch (error) {
      console.error(
        "RE-ADMISSION ERROR:",
        error
      );

      alert(
        error?.message ||
          "Re-Admission failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <form
      onSubmit={handleSubmit}
      className="p-10 bg-gray-100 rounded-lg"
    >
      <h2 className="text-2xl font-bold mb-6">
        RE-ADMISSION STUDENT
      </h2>

      {/* =====================================================
          STUDENT + COURSE
      ===================================================== */}

      <div className="grid grid-cols-3 gap-6 mb-8">

        <div>
          <label className="block mb-1 font-semibold">
            Select Student *
          </label>

          <select
            className="border p-2 w-full"
            onChange={(e) =>
              handleStudentSelect(
                e.target.value
              )
            }
            required
          >
            <option value="">
              -- Select Student --
            </option>

            {students.map((student) => (
              <option
                key={student.$id}
                value={student.$id}
              >
                {student.studentName} (
                {student.mobile})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-semibold">
            Course of Interest *
          </label>

          <select
            onChange={handleCourseSelect}
            className="border p-2 w-full"
            required
          >
            <option value="">
              -- Select Course --
            </option>

            {allCourses.map((course) => (
              <option
                key={`${course.courseType}-${course.$id}`}
                value={course.$id}
              >
                {course.courseName ||
                  course.courseCode}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-semibold">
            Select Exam Type *
          </label>

          <select
            name="examType"
            value={form.examType}
            onChange={handleChange}
            className="border p-2 w-full"
            required
          >
            <option value="">
              -- Select --
            </option>

            <option value="Online">
              Online
            </option>

            <option value="Offline">
              Offline
            </option>
          </select>
        </div>

      </div>

      {/* =====================================================
          SELECTED STUDENT PREVIEW
      ===================================================== */}

      {selectedStudent && (
        <div className="border bg-white p-4 mb-8 rounded">
          <h3 className="font-bold mb-3">
            Existing Student Details
          </h3>

          <div className="grid grid-cols-4 gap-4 text-sm">

            <div>
              <strong>Name:</strong>{" "}
              {selectedStudent.studentName}
            </div>

            <div>
              <strong>Mobile:</strong>{" "}
              {selectedStudent.mobile}
            </div>

            <div>
              <strong>DOB:</strong>{" "}
              {selectedStudent.dob}
            </div>

            <div>
              <strong>Photo:</strong>{" "}
              {selectedStudent.photoId
                ? "Available"
                : "Not Available"}
            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          COURSE INFORMATION
      ===================================================== */}

      <div className="grid grid-cols-3 gap-6 mb-8">

        <div>
          <label className="block mb-1 font-semibold">
            Course
          </label>

          <input
            value={
              form.courseDisplayName
            }
            readOnly
            className="border p-2 w-full bg-gray-200"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">
            Course Code
          </label>

          <input
            value={form.courseCode}
            readOnly
            className="border p-2 w-full bg-gray-200"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">
            Course Type
          </label>

          <input
            value={form.courseType}
            readOnly
            className="border p-2 w-full bg-gray-200"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">
            Subjects
          </label>

          <input
            value={form.subjects}
            readOnly
            className="border p-2 w-full bg-gray-200"
          />
        </div>

      </div>

      {/* =====================================================
          FEES
      ===================================================== */}

      <div className="grid grid-cols-6 gap-4 mb-8">

        <div>
          <label className="block mb-1 font-semibold">
            Course Fees
          </label>

          <input
            name="courseFees"
            value={form.courseFees}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">
            Discount
          </label>

          <input
            name="discount"
            value={form.discount}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">
            Total Fees
          </label>

          <input
            name="totalFees"
            value={form.totalFees}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">
            Fees Received
          </label>

          <input
            name="feesReceived"
            value={form.feesReceived}
            onChange={handleChange}
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
            className="border p-2 w-full bg-gray-200"
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

      {/* =====================================================
          INSTALLMENTS
      ===================================================== */}

      <h3 className="font-semibold mb-2">
        Installment Details
      </h3>

      {installments.map(
        (item, index) => (
          <div
            key={index}
            className="grid grid-cols-4 gap-4 mb-4"
          >

            <div>
              <label>
                Installment Name
              </label>

              <input
                value={item.name}
                className="border p-2 w-full"
                onChange={(e) =>
                  handleInstallmentChange(
                    index,
                    "name",
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <label>
                Amount
              </label>

              <input
                value={item.amount}
                className="border p-2 w-full"
                onChange={(e) =>
                  handleInstallmentChange(
                    index,
                    "amount",
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <label>
                Date
              </label>

              <input
                type="date"
                value={item.date}
                className="border p-2 w-full"
                onChange={(e) =>
                  handleInstallmentChange(
                    index,
                    "date",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="flex items-end">
              {index ===
                installments.length - 1 && (
                <button
                  type="button"
                  onClick={
                    addInstallment
                  }
                  className="bg-yellow-400 px-4 py-2 rounded"
                >
                  + Add More
                </button>
              )}
            </div>

          </div>
        )
      )}

      {/* =====================================================
          BATCH
      ===================================================== */}

      <div className="grid grid-cols-3 gap-6 mb-8">

        <div>
          <label className="block mb-1 font-semibold">
            Select Batch For Student *
          </label>

          <input
            name="batch"
            value={form.batch}
            onChange={handleChange}
            className="border p-2 w-full"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">
            Remaining Seats
          </label>

          <input
            name="remainingSeats"
            value={form.remainingSeats}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>

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

      </div>

      {/* =====================================================
          BUTTONS
      ===================================================== */}

      <div className="flex gap-4">

        <button
          type="submit"
          disabled={loading}
          className={`px-6 py-2 rounded text-white ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading
            ? "Processing..."
            : "Submit Re-Admission"}
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

