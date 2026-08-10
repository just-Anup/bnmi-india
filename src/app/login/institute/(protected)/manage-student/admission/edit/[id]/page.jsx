"use client";

import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";
import { Storage, Client, ID, Query } from "appwrite";
import { useParams, useRouter } from "next/navigation";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = "student_admissions";
const BUCKET_ID = "6986e8a4001925504f6b";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

const storage = new Storage(client);

export default function EditStudent() {

  const { id } = useParams();
  const router = useRouter();

  const [photo, setPhoto] = useState(null);
  const [signature, setSignature] = useState(null);

  const [photoPreview, setPhotoPreview] = useState("");
  const [signaturePreview, setSignaturePreview] = useState("");

  const [form, setForm] = useState({

    studentName: "",
    surname: "",

    relationType: "S/O",

    fatherName: "",
    motherName: "",

    showFatherInCertificate: false,
    showMotherInCertificate: false,

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

    courseName: "",
    subjects: "",

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

    try {

      const res = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        id
      );

      setForm(res);

      // PHOTO PREVIEW
      if (res.photoId) {
        setPhotoPreview(
          `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${res.photoId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
        );
      }

      // SIGNATURE PREVIEW
      if (res.signatureId) {
        setSignaturePreview(
          `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${res.signatureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
        );
      }

    } catch (err) {

      console.log(err);
      alert("Failed to load student");

    }
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
    const balance = total - (Number(form.feesReceived) || 0);

    setForm(prev => ({
      ...prev,
      courseFees: fees,
      discount: disc,
      totalFees: total,
      balance
    }));

  };

  const handleFeesReceived = (value) => {

    const received = Number(value) || 0;

    const balance =
      (Number(form.totalFees) || 0) - received;

    setForm(prev => ({
      ...prev,
      feesReceived: received,
      balance
    }));

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      let photoId = form.photoId;
      let signatureId = form.signatureId;

      // PHOTO UPDATE
      if (photo) {

        const uploadPhoto = await storage.createFile(
          BUCKET_ID,
          ID.unique(),
          photo
        );

        photoId = uploadPhoto.$id;
      }

      // SIGNATURE UPDATE
      if (signature) {

        const uploadSign = await storage.createFile(
          BUCKET_ID,
          ID.unique(),
          signature
        );

        signatureId = uploadSign.$id;
      }

      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        id,
        {

          ...form,

          photoId,
          signatureId,

          courseFees: Number(form.courseFees) || 0,
          discount: Number(form.discount) || 0,
          totalFees: Number(form.totalFees) || 0,
          feesReceived: Number(form.feesReceived) || 0,
          balance: Number(form.balance) || 0

        }
      );

      // Update certificate also
try {
  const cert = await databases.listDocuments(
    DATABASE_ID,
    "certificates",
    [
      Query.equal("studentId", id)
    ]
  );

  if (cert.documents.length > 0) {
    await databases.updateDocument(
      DATABASE_ID,
      "certificates",
      cert.documents[0].$id,
    {
    studentName: form.studentName,
    surname: form.surname,
    relationType: form.relationType,
    fatherName: form.fatherName,
    motherName: form.motherName,

    photoId: photoId,
    signatureId: signatureId,

    dob: form.dob,
    courseName: form.courseName,
    subjects: form.subjects,

    showFatherInCertificate: form.showFatherInCertificate,
    showMotherInCertificate: form.showMotherInCertificate
}
    );
  }
} catch (err) {
  console.log("Certificate update failed", err);
}

      alert("Student Updated Successfully");

      router.push("/login/institute/manage-student/admission");

    } catch (err) {

      console.log(err);
      alert(err?.message || "Update failed");

    }

  };

  return (

    <form
      onSubmit={handleSubmit}
      className="p-10 bg-gray-100 min-h-screen"
    >

      <h1 className="text-3xl font-bold mb-8">
        Edit Student Admission
      </h1>

      {/* PHOTO + SIGNATURE */}

      <div className="grid grid-cols-2 gap-6 mb-8">

        <div>

          <label className="block font-semibold mb-2">
            Student Photo
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {

              const file = e.target.files[0];

              setPhoto(file);

              if (file) {
                setPhotoPreview(URL.createObjectURL(file));
              }

            }}
            className="border p-2 w-full bg-white"
          />

          {photoPreview && (
            <img
              src={photoPreview}
              className="w-28 h-28 object-cover rounded mt-3 border"
            />
          )}

        </div>

        <div>

          <label className="block font-semibold mb-2">
            Signature
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {

              const file = e.target.files[0];

              setSignature(file);

              if (file) {
                setSignaturePreview(URL.createObjectURL(file));
              }

            }}
            className="border p-2 w-full bg-white"
          />

          {signaturePreview && (
            <img
              src={signaturePreview}
              className="w-28 h-20 object-contain rounded mt-3 border bg-white"
            />
          )}

        </div>

      </div>

      {/* FORM */}

      <div className="grid grid-cols-3 gap-6">

        <input
          name="studentName"
          value={form.studentName || ""}
          placeholder="Student Name"
          onChange={handleChange}
          className="border p-3 bg-white"
        />

        <input
          name="surname"
          value={form.surname || ""}
          placeholder="Surname"
          onChange={handleChange}
          className="border p-3 bg-white"
        />

        <select
          name="relationType"
          value={form.relationType || "S/O"}
          onChange={handleChange}
          className="border p-3 bg-white"
        >
          <option>S/O</option>
          <option>D/O</option>
          <option>W/O</option>
        </select>

        {/* FATHER */}

        <div>

          <input
            name="fatherName"
            value={form.fatherName || ""}
            placeholder="Father Name"
            onChange={handleChange}
            className="border p-3 w-full bg-white"
          />

          <div className="flex items-center gap-2 mt-2">

            <input
              type="checkbox"
              checked={form.showFatherInCertificate || false}
              onChange={(e) =>
                setForm({
                  ...form,
                  showFatherInCertificate: e.target.checked
                })
              }
            />

            <label className="text-sm">
              Show in Certificate
            </label>

          </div>

        </div>

        {/* MOTHER */}

        <div>

          <input
            name="motherName"
            value={form.motherName || ""}
            placeholder="Mother Name"
            onChange={handleChange}
            className="border p-3 w-full bg-white"
          />

          {/* <div className="flex items-center gap-2 mt-2">

            <input
              type="checkbox"
              checked={form.showMotherInCertificate || false}
              onChange={(e) =>
                setForm({
                  ...form,
                  showMotherInCertificate: e.target.checked
                })
              }
            />

            <label className="text-sm">
              Show in Certificate
            </label>

          </div> */}

        </div>

        <input
          name="mobile"
          value={form.mobile || ""}
          placeholder="Mobile"
          onChange={handleChange}
          className="border p-3 bg-white"
        />

        <input
          name="altMobile"
          value={form.altMobile || ""}
          placeholder="Alternate Mobile"
          onChange={handleChange}
          className="border p-3 bg-white"
        />

        <input
          name="email"
          value={form.email || ""}
          placeholder="Email"
          onChange={handleChange}
          className="border p-3 bg-white"
        />

        <input
          type="date"
          name="dob"
          value={form.dob || ""}
          onChange={handleChange}
          className="border p-3 bg-white"
        />

        <select
          name="gender"
          value={form.gender || ""}
          onChange={handleChange}
          className="border p-3 bg-white"
        >
          <option value="">Select Gender</option>
          <option>Male</option>
          <option>Female</option>
        </select>

        <input
          name="aadhar"
          value={form.aadhar || ""}
          placeholder="Aadhar"
          onChange={handleChange}
          className="border p-3 bg-white"
        />

        <input
          name="qualification"
          value={form.qualification || ""}
          placeholder="Qualification"
          onChange={handleChange}
          className="border p-3 bg-white"
        />

        <input
          name="occupation"
          value={form.occupation || ""}
          placeholder="Occupation"
          onChange={handleChange}
          className="border p-3 bg-white"
        />

      

        <textarea
          name="address"
          value={form.address || ""}
          placeholder="Address"
          onChange={handleChange}
          className="border p-3 bg-white col-span-3"
        />

        <input
          name="courseName"
          value={form.courseName || ""}
          placeholder="Course Name"
          onChange={handleChange}
          className="border p-3 bg-white"
        />

        <input
          name="subjects"
          value={form.subjects || ""}
          placeholder="Subjects"
          onChange={handleChange}
          className="border p-3 bg-white"
        />

        <input
          name="batch"
          value={form.batch || ""}
          placeholder="Batch"
          onChange={handleChange}
          className="border p-3 bg-white"
        />

        {/* FEES */}

        <input
          type="number"
          value={form.courseFees || 0}
          placeholder="Course Fees"
          onChange={(e) =>
            calculateFees(e.target.value, form.discount)
          }
          className="border p-3 bg-white"
        />

        <input
          type="number"
          value={form.discount || 0}
          placeholder="Discount"
          onChange={(e) =>
            calculateFees(form.courseFees, e.target.value)
          }
          className="border p-3 bg-white"
        />

        <input
          value={form.totalFees || 0}
          readOnly
          className="border p-3 bg-gray-200"
        />

        <input
          type="number"
          value={form.feesReceived || 0}
          placeholder="Fees Received"
          onChange={(e) =>
            handleFeesReceived(e.target.value)
          }
          className="border p-3 bg-white"
        />

        <input
          value={form.balance || 0}
          readOnly
          className="border p-3 bg-gray-200"
        />

        <input
          type="date"
          name="admissionDate"
          value={form.admissionDate || ""}
          onChange={handleChange}
          className="border p-3 bg-white"
        />

        <textarea
          name="remark"
          value={form.remark || ""}
          placeholder="Remark"
          onChange={handleChange}
          className="border p-3 bg-white col-span-3"
        />

      </div>

      <div className="mt-8 flex justify-center">

        <button
          type="submit"
          className="bg-blue-600 text-white px-8 py-3 rounded-lg"
        >
          Update Student
        </button>

      </div>

    </form>

  );

}