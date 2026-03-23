'use client'

import Link from 'next/link'

export default function AddCourseHome() {
    return (
        <div className="min-h-screen bg-black p-10">

            <div className="bg-[#111111] rounded-2xl p-8 shadow-xl border border-gray-800">

                <h1 className="text-3xl font-bold text-white mb-10">
                    Course Management
                </h1>

                <div className="grid md:grid-cols-3 gap-6">

                    <NavBtn
                        label="List Course With Single Subject"
                        href="/login/institute/add-course/single/list"
                    />

                    <NavBtn
                        label="Add Course With Single Subject"
                        href="/login/institute/add-course/single/add"
                    />

                    <NavBtn
                        label="List Course With Multiple Subject"
                        href="/login/institute/add-course/multiple/list"
                    />

                    <NavBtn
                        label="Add Course With Multiple Subject"
                        href="/login/institute/add-course/multiple/add"
                    />

                    <NavBtn
                        label="List Typing Course"
                        href="/login/institute/add-course/typing/list"
                    />

                    <NavBtn
                        label="Add Typing Course"
                        href="/login/institute/add-course/typing/add"
                    />
                    
                    <NavBtn
                        label="Semester Course List"
                        href="/login/institute/add-course/semester-course"
                    />
                    <NavBtn
                        label="Add Semester Course"
                        href="/login/institute/add-course/semester-course/add"
                    />

                </div>

            </div>
        </div>
    )
}

function NavBtn({ label, href }) {
    return (
        <Link
            href={href}
            className="bg-orange-500 hover:bg-orange-600 text-black font-semibold 
                 px-6 py-4 rounded-xl transition text-center shadow-md"
        >
            {label}
        </Link>
    )
}