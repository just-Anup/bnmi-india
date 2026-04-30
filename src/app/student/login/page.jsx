"use client";

import { useState } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useRouter } from "next/navigation";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = "student_admissions";

export default function StudentLogin() {
  const router = useRouter();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const inputUsername = form.username.trim().toLowerCase();
      const inputPassword = String(form.password).trim();

      // 🔍 Fetch matching usernames first
      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal("username", form.username.trim())]
      );

      console.log("INPUT:", inputUsername, inputPassword);
      console.log("DB RESPONSE:", res.documents);

      if (res.documents.length === 0) {
        alert("User not found");
        setLoading(false);
        return;
      }

      // 🔥 Find exact match safely
      const student = res.documents.find((item) => {
        const dbUsername = item.username?.trim().toLowerCase();
        const dbPassword = String(item.password).trim();

        return (
          dbUsername === inputUsername &&
          dbPassword === inputPassword
        );
      });

      if (!student) {
        alert("Invalid credentials");
        setLoading(false);
        return;
      }

      // ✅ SUCCESS
      localStorage.setItem("student", JSON.stringify(student));

      alert("Login Successful");
      router.push("/student/dashboard");

    } catch (err) {
      console.error("LOGIN ERROR:", err);
      alert("Login failed");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600">

      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-center mb-6">
          Student Login
        </h2>

        {/* Username */}
        <div className="mb-4">
          <label className="text-sm font-semibold">Username</label>
          <input
            type="text"
            value={form.username}
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
            className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your username"
            required
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="text-sm font-semibold">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

      </form>
    </div>
  );
}