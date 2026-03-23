'use client'

import { useEffect, useState } from "react"

export default function PrintMarksheet() {

  const [student, setStudent] = useState(null)

  useEffect(() => {
    const data = localStorage.getItem("marksheetStudent")

    if (data) {
      const parsed = JSON.parse(data)
      console.log("MARKSHEET DATA:", parsed)
      setStudent(parsed)
    }
  }, [])

  if (!student) return <div className="p-10">Loading...</div>

  const printPage = () => window.print()

  // ✅ SUBJECT DATA
  const marksArray = student.marksArray || []

  // ✅ TOTAL
  const total = marksArray.reduce((sum, m) => {
    return sum + Number(m.total || 0)
  }, 0)

  return (

    <div className="p-10 bg-white">

      <button
        onClick={printPage}
        className="bg-blue-600 text-white px-6 py-2 mb-6"
      >
        Print Marksheet
      </button>

      <div className="relative w-[900px] h-[1200px] mx-auto">

        {/* TEMPLATE */}
        <img src="/marksheet.jpeg" className="absolute w-full h-full" />

        {/* LEFT SIDE */}

        <div className="absolute top-[320px] left-[180px]">
          {student.studentName}
        </div>

        <div className="absolute top-[360px] left-[180px]">
          {student.fatherName}
        </div>

        <div className="absolute top-[400px] left-[180px]">
          {student.surname}
        </div>

        <div className="absolute top-[440px] left-[180px]">
          {student.motherName}
        </div>

        <div className="absolute top-[480px] left-[180px]">
          {student.course}
        </div>

        <div className="absolute top-[520px] left-[180px]">
          {student.instituteName}
        </div>

        {/* RIGHT SIDE */}

        <div className="absolute top-[320px] left-[600px]">
          1 Year
        </div>

        <div className="absolute top-[360px] left-[600px]">
          {student.marksheetNo}
        </div>

        <div className="absolute top-[400px] left-[600px]">
          {student.dob}
        </div>

        <div className="absolute top-[440px] left-[600px]">
          {student.coursePeriod}
        </div>

        {/* SUBJECT TABLE */}

        {marksArray.map((m, index) => {

          const top = 650 + index * 40

          return (
            <div key={index}>

              <div className="absolute" style={{ top, left: 100 }}>
                {m.subject}
              </div>

              <div className="absolute" style={{ top, left: 500 }}>
                100
              </div>

              <div className="absolute" style={{ top, left: 600 }}>
                {m.theory}
              </div>

              <div className="absolute" style={{ top, left: 700 }}>
                {m.practical}
              </div>

              <div className="absolute" style={{ top, left: 800 }}>
                {m.total}
              </div>

            </div>
          )
        })}

        {/* TOTAL */}

        <div className="absolute bottom-[250px] left-[750px] font-bold">
          {total}
        </div>

        {/* GRADE */}

        <div className="absolute bottom-[250px] left-[850px] font-bold">
          {student.grade}
        </div>

      </div>

    </div>
  )
}