"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { ID, Query } from "appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = "batches";

export default function BatchPage() {

  const [batches, setBatches] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    batchName: "",
    timing: "",
    totalStudents: "",
  });

  useEffect(() => {
    loadBatches();
  }, []);

  // 🔥 LOAD BATCHES
  const loadBatches = async () => {
    try {
      const user = await account.get();

      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal("franchiseEmail", user.email)]
      );

      setBatches(res.documents);

    } catch (err) {
      console.log(err);
    }
  };

  // 🔥 HANDLE INPUT
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔥 ADD BATCH
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const user = await account.get();

      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          batchName: form.batchName,
          timing: form.timing,
          totalStudents: Number(form.totalStudents || 0),
          franchiseEmail: user.email,
          createdAt: new Date().toISOString(),
        }
      );

      alert("Batch Added Successfully ✅");

      setForm({
        batchName: "",
        timing: "",
        totalStudents: "",
      });

      setShowForm(false);
      loadBatches();

    } catch (err) {
      console.log(err);
      alert(err.message);
    }
  };

  // 🔥 DELETE
  const deleteBatch = async (id) => {
    if (!confirm("Delete this batch?")) return;

    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, id);
      loadBatches();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="p-8 bg-gray-100 rounded">

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">LIST BATCHES</h1>

        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          NEW BATCH
        </button>
      </div>

      {/* ADD FORM */}
      {showForm && (
        <div className="bg-white p-6 rounded shadow mb-6">

          <h2 className="text-xl font-semibold mb-4">
            ADD NEW BATCH
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">

            <div>
              <label className="font-semibold">Batch Name</label>
              <input
                name="batchName"
                value={form.batchName}
                onChange={handleChange}
                className="border p-2 w-full"
                required
              />
            </div>

            <div>
              <label className="font-semibold">Batch Timing</label>
              <input
                name="timing"
                value={form.timing}
                onChange={handleChange}
                className="border p-2 w-full"
              />
            </div>

            <div>
              <label className="font-semibold">
                Number Of Students
              </label>
              <input
                type="number"
                name="totalStudents"
                value={form.totalStudents}
                onChange={handleChange}
                className="border p-2 w-full"
              />
            </div>

            <div className="flex items-end gap-3">
              <button className="bg-blue-600 text-white px-6 py-2 rounded">
                Submit
              </button>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-red-500 text-white px-6 py-2 rounded"
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      )}

      {/* LIST TABLE */}
      <div className="bg-white p-6 rounded shadow">

        <table className="w-full border">

          <thead>
            <tr className="bg-yellow-200">
              <th className="p-2 border">S/N</th>
              <th className="p-2 border">Batch Name</th>
              <th className="p-2 border">Timing</th>
              <th className="p-2 border">Number Of Student</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>

          <tbody>
            {batches.map((batch, index) => (
              <tr key={batch.$id}>
                <td className="p-2 border">{index + 1}</td>

                <td className="p-2 border">
                  {batch.batchName}
                </td>

                <td className="p-2 border">
                  {batch.timing}
                </td>

                <td className="p-2 border">
                  {batch.totalStudents}
                </td>

                <td className="p-2 border flex gap-2">

                  <button className="bg-blue-500 text-white px-3 py-1 rounded">
                    ✏️
                  </button>

                  <button
                    onClick={() => deleteBatch(batch.$id)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    🗑
                  </button>

                </td>
              </tr>
            ))}
          </tbody>

        </table>

      </div>

    </div>
  );
}