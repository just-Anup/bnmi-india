"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";

export default function StudentLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [student, setStudent] = useState(null);
  const [time, setTime] = useState("");

  const router = useRouter();

  useEffect(() => {
    const data = localStorage.getItem("student");

    if (!data) {
      router.push("/student/login");
    } else {
      setStudent(JSON.parse(data));
    }

    // live time
    const interval = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!student) return null;

  return (
    <div className="flex h-screen bg-gray-100">

      {/* 🔷 SIDEBAR */}
      <div
        className={`bg-gradient-to-b from-[#2d2a1f] to-[#3b3727] text-white 
        ${sidebarOpen ? "w-64" : "w-16"} transition-all duration-300`}
      >
        <div className="p-4 text-center border-b border-gray-600">
          <h1 className="text-lg font-bold">Student Panel</h1>
        </div>

        <nav className="p-3 space-y-2 text-sm">

          <SidebarItem label="Dashboard" onClick={() => router.push("/student/dashboard")} />
          <SidebarItem label="My Courses" />
          <SidebarItem label="Practice MCQ" onClick={() => router.push("/student/quiz")} />
          <SidebarItem label="Results" />
          <SidebarItem label="Attendance" />
          <SidebarItem label="Wallet" />
          <SidebarItem label="Support" />

        </nav>
      </div>

      {/* 🔷 MAIN AREA */}
      <div className="flex-1 flex flex-col">

        {/* 🔷 TOP BAR */}
        <div className="bg-[#8a9a00] text-white flex items-center justify-between px-6 py-3 shadow">

          <div className="flex items-center gap-3">
            <Menu
              className="cursor-pointer"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            />
            <h2 className="font-semibold">Student Dashboard</h2>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span>{time}</span>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full"></div>
              <span>{student.studentName}</span>
            </div>
          </div>

        </div>

        {/* 🔷 CONTENT */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>

      </div>
    </div>
  );
}

/* 🔷 SIDEBAR ITEM COMPONENT */
function SidebarItem({ label, onClick }) {
  return (
    <div
      onClick={onClick}
      className="p-3 rounded-lg hover:bg-white/10 cursor-pointer transition"
    >
      {label}
    </div>
  );
}