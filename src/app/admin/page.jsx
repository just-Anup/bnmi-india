"use client";

import { useRouter } from "next/navigation";

export default function AdminSelect() {

  const router = useRouter();

  return (

    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#eef2ff] via-[#f8fafc] to-[#e0f2fe] px-4">

      {/* 🔵 BACKGROUND DECOR */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-400/30 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl"></div>
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-pink-300/20 rounded-full blur-2xl"></div>

      {/* subtle grid */}
      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      {/* MAIN CONTENT */}
      <div className="relative w-full max-w-5xl z-10">

        <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-10 text-gray-800">
          BNMI Administration
        </h1>

        <div className="grid md:grid-cols-2 gap-8">

          {/* WEBSITE MANAGEMENT */}
          <div
            onClick={() => router.push("/admin/website")}
            className="group cursor-pointer bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
          >
            <div className="h-48 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1559028012-481c04fa702d"
                alt="Website Management"
                className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
              />
            </div>

            <div className="p-6 text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Website Management
              </h2>
              <p className="text-gray-500 text-sm">
                Manage homepage, banners, content, and UI sections
              </p>

              <div className="mt-4">
                <span className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg text-sm group-hover:bg-purple-700 transition">
                  Enter Panel →
                </span>
              </div>
            </div>
          </div>

          {/* ADMIN MANAGEMENT */}
          <div
            onClick={() => router.push("/admin/dashboard")}
            className="group cursor-pointer bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
          >
            <div className="h-48 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1551836022-d5d88e9218df"
                alt="Admin Management"
                className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
              />
            </div>

            <div className="p-6 text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Admin Management
              </h2>
              <p className="text-gray-500 text-sm">
                Manage users, dashboards, reports and system control
              </p>

              <div className="mt-4">
                <span className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm group-hover:bg-blue-700 transition">
                  Enter Panel →
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>

  );
}