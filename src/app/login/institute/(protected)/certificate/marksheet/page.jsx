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

  const franchiseSign = student.franchiseSignature || null;

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

        <div className="absolute top-[325px] left-[330px]">
          {student.studentName}
        </div>

        <div className="absolute top-[346px] left-[330px]">
          {student.fatherName}
        </div>

        <div className="absolute top-[367px] left-[330px]">
          {student.surname}
        </div>

        <div className="absolute top-[388px] left-[330px]">
          {student.motherName}
        </div>

        <div className="absolute top-[410px] left-[330px]">
          {student.course}
        </div>

        <div className="absolute top-[450px] left-[330px]">
          {student.instituteName}
        </div>

        {/* RIGHT SIDE */}

        <div className="absolute top-[325px] left-[680px]">
          1 Year
        </div>

        <div className="absolute top-[348px] left-[680px]">
          {student.marksheetNo}
        </div>

        <div className="absolute top-[369px] left-[680px]">
          {student.dob}
        </div>

        <div className="absolute top-[390px] left-[680px]">
          {student.coursePeriod}
        </div>

        {/* SUBJECT TABLE */}

        {marksArray.map((m, index) => {

  const top = 650 + index * 40;

  return (
    <div key={index}>

      {/* SUBJECT */}
      <div className="absolute" style={{ top: 550, left: 150 }}>
        {m.subject || "-"}
      </div>

      {/* MAX MARKS */}
      <div className="absolute" style={{ top: 550, left: 530 }}>
        100
      </div>

      {/* OBJECTIVE */}
      <div className="absolute" style={{ top: 550, left: 590 }}>
        {m.objective || 0}
      </div>

      {/* PRACTICAL */}
      <div className="absolute" style={{ top: 550, left: 660 }}>
        {m.practical || 0}
      </div>

      {/* TOTAL */}
      <div className="absolute" style={{ top: 550, left: 720 }}>
        {m.total || 0}
      </div>

    </div>
  );
})}
        {/* TOTAL */}

        <div className="absolute bottom-[210px] left-[780px] font-bold">
          {total}
        </div>

        {/* GRADE */}

        <div className="absolute top-[550px] left-[780px] font-bold">
          {student.grade}
        </div>
        {franchiseSign && (
          <img
            src={franchiseSign}
            className="absolute bottom-[60px] left-[130px] w-[100px] object-contain"
          />
        )}

      </div>

    </div>
  )
}