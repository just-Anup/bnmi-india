"use client";

import { useRouter } from "next/navigation";

export default function AdminSelect() {

    const router = useRouter();

    return (

        <div className="flex items-center justify-center h-screen bg-gray-100">

            <div className="bg-white shadow-lg p-10 rounded-lg text-center">

                <h1 className="text-2xl font-bold mb-8">
                    BNMI Administration
                </h1>

                <div className="flex gap-6">

                    <button
                        onClick={() => router.push("/admin/website")}
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg"
                    >
                        Website Management
                    </button>

                    <button
                        onClick={() => router.push("/admin/dashboard")}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg"
                    >
                        Admin Management
                    </button>

                </div>

            </div>

        </div>

    );

}