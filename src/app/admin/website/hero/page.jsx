"use client";

import { useState, useEffect } from "react";
import { databases, ID } from "@/lib/appwrite";

const DB = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION = "website";

export default function CMSPage() {
  const [states, setStates] = useState([]);
  const [stateName, setStateName] = useState("");
  const [institutes, setInstitutes] = useState("");

  const [editingId, setEditingId] = useState(null);

  /* ================= FETCH ================= */
  const fetchStates = async () => {
    try {
      const res = await databases.listDocuments(DB, COLLECTION);

      const filtered = res.documents.filter(
        (d) => d.type === "state"
      );

      setStates(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  /* ================= ADD ================= */
  const addState = async () => {
    if (!stateName) return;

    try {
      await databases.createDocument(DB, COLLECTION, ID.unique(), {
        type: "state",
        name: stateName,
        institutes: institutes.split(",").map((i) => i.trim()),
      });

      setStateName("");
      setInstitutes("");
      fetchStates();
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= DELETE ================= */
  const deleteState = async (id) => {
    try {
      await databases.deleteDocument(DB, COLLECTION, id);
      fetchStates();
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= EDIT ================= */
  const startEdit = (state) => {
    setEditingId(state.$id);
    setStateName(state.name);
    setInstitutes(state.institutes.join(", "));
  };

  const updateState = async () => {
    try {
      await databases.updateDocument(DB, COLLECTION, editingId, {
        name: stateName,
        institutes: institutes.split(",").map((i) => i.trim()),
      });

      setEditingId(null);
      setStateName("");
      setInstitutes("");
      fetchStates();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-10 bg-black text-white min-h-screen">
      <h1 className="text-3xl mb-6">State CMS</h1>

      {/* FORM */}
      <div className="mb-6">
        <input
          placeholder="State Name"
          value={stateName}
          onChange={(e) => setStateName(e.target.value)}
          className="p-2 bg-gray-800 mr-2"
        />

        <input
          placeholder="Institutes (comma separated)"
          value={institutes}
          onChange={(e) => setInstitutes(e.target.value)}
          className="p-2 bg-gray-800 w-[400px]"
        />

        {editingId ? (
          <button
            onClick={updateState}
            className="bg-yellow-500 px-4 py-2 ml-2"
          >
            Update
          </button>
        ) : (
          <button
            onClick={addState}
            className="bg-cyan-500 px-4 py-2 ml-2"
          >
            Add State
          </button>
        )}
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {states.map((state) => (
          <div
            key={state.$id}
            className="bg-gray-900 p-4 rounded-lg"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {state.name}
              </h2>

              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(state)}
                  className="bg-blue-500 px-3 py-1 text-sm"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteState(state.$id)}
                  className="bg-red-500 px-3 py-1 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="mt-2 text-sm text-gray-400">
              {state.institutes.join(", ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}