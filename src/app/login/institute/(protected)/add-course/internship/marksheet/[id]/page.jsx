'use client'

export const dynamic = "force-dynamic"

import {
  useEffect,
  useRef,
  useState
} from 'react'

import { useParams } from 'next/navigation'

import {
  databases
} from '@/lib/appwrite'


import * as htmlToImage from 'html-to-image'


const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID


export default function InternshipMarksheet() {

  const { id } = useParams()

const [student, setStudent] =
  useState(null)


const [subjects, setSubjects] =
  useState([])

  const [loading, setLoading] =
    useState(true)

  const printRef =
    useRef(null)


  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {

    if (!date) {
      return ""
    }

    const d = new Date(date)

    const day =
      String(d.getDate()).padStart(2, "0")

    const month =
      String(d.getMonth() + 1).padStart(2, "0")

    const year =
      d.getFullYear()

    return `${day}/${month}/${year}`

  }


  // ==========================================
  // LOAD STUDENT
  // ==========================================

  useEffect(() => {

    if (!id) {
      return
    }


 const loadStudent = async () => {

  try {

    // ==========================================
    // LOAD INTERNSHIP CERTIFICATE
    // ==========================================

    const doc =
      await databases.getDocument(
        DATABASE_ID,
        "internship_certificates",
        id
      )


    setStudent(doc)



    // ==========================================
    // PARSE SUBJECTS
    // ==========================================

    let parsedSubjects = []


    try {

      if (doc.subjects) {

        parsedSubjects =
          JSON.parse(doc.subjects)

      }

    } catch (error) {

      console.log(
        "Subject parsing error:",
        error
      )

    }


    setSubjects(
      Array.isArray(parsedSubjects)
        ? parsedSubjects
        : []
    )


  } catch (error) {

    console.log(
      "Student loading error:",
      error
    )

  } finally {

    setLoading(false)

  }

}


    loadStudent()

  }, [id])


  // ==========================================
  // TOTAL OF ONE SUBJECT
  // ==========================================

  const getTotal = (subject) => {

    return (
      Number(subject.objective || 0) +
      Number(subject.practical || 0)
    )

  }


  // ==========================================
  // GRAND TOTAL
  // ==========================================

  const totalMarks =
    subjects.reduce(
      (sum, subject) =>
        sum + getTotal(subject),
      0
    )


  // ==========================================
  // MAXIMUM MARKS
  // ==========================================

  const maximumMarks =
    subjects.length * 100


  // ==========================================
  // PERCENTAGE
  // ==========================================

  const percentage =
    maximumMarks > 0
      ? (
          totalMarks /
          maximumMarks
        ) * 100
      : 0


  // ==========================================
  // GRADE
  // ==========================================

  const getGrade = (percent) => {

    if (percent >= 85)
      return "A+"

    if (percent >= 70)
      return "A"

    if (percent >= 55)
      return "B"

    if (percent >= 40)
      return "C"

    return "F"

  }


  const grade =
    getGrade(percentage)


  // ==========================================
  // COURSE PERIOD
  // ==========================================

  const coursePeriod =
    `${formatDate(student?.fromDate)} To ${formatDate(student?.toDate)}`


  // ==========================================
  // MARKSHEET NUMBER
  // ==========================================

  const marksheetNo =
    student?.certificateNo
      ? student.certificateNo.replace(
          "INT-",
          "MS-"
        )
      : ""


  // ==========================================
  // DOWNLOAD
  // ==========================================

 const handleDownload = async () => {

  try {

    if (!printRef.current) {
      return
    }


    const node =
      printRef.current


    // ==========================================
    // WAIT FOR IMAGES
    // ==========================================

    await new Promise(
      resolve => setTimeout(resolve, 500)
    )


    // ==========================================
    // CONVERT IMAGES TO BASE64
    // ==========================================

    const images =
      node.querySelectorAll("img")


    for (const img of images) {

      if (
        img.src &&
        !img.src.startsWith("data:")
      ) {

        try {

          const response =
            await fetch(img.src)


          const blob =
            await response.blob()


          const base64 =
            await new Promise(
              resolve => {

                const reader =
                  new FileReader()

                reader.onloadend =
                  () => resolve(
                    reader.result
                  )

                reader.readAsDataURL(blob)

              }
            )


          img.src = base64


        } catch (error) {

          console.log(
            "IMAGE CONVERSION ERROR:",
            error
          )

        }

      }

    }


    // ==========================================
    // GENERATE IMAGE
    // ==========================================

    const dataUrl =
      await htmlToImage.toJpeg(
        node,
        {
          quality: 0.98,
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: "#ffffff"
        }
      )


    // ==========================================
    // DOWNLOAD
    // ==========================================

    const link =
      document.createElement("a")


    link.download =
      `${student.studentName}_internship_marksheet.jpg`


    link.href =
      dataUrl


    link.click()


  } catch (error) {

    console.log(
      "DOWNLOAD ERROR:",
      error
    )

    alert(
      "Unable to download marksheet"
    )

  }

}

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="min-h-screen bg-gray-100 flex items-center justify-center">

        <div className="text-xl font-semibold">
          Loading Marksheet...
        </div>

      </div>

    )

  }


  // ==========================================
  // NOT FOUND
  // ==========================================

  if (!student) {

    return (

      <div className="min-h-screen bg-gray-100 flex items-center justify-center">

        <div className="text-xl font-semibold">
          Marksheet not found
        </div>

      </div>

    )

  }


  // ==========================================
  // PAGE
  // ==========================================

  return (

    <div className="min-h-screen bg-gray-200 py-8 px-4">


      {/* ======================================
          TOP BUTTON
      ====================================== */}

      <div className="max-w-[1024px] mx-auto mb-6 flex justify-between items-center">

        <h1 className="text-xl font-bold text-gray-800">
          Internship Marksheet
        </h1>


        <button
          onClick={handleDownload}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
        >
          Download Marksheet
        </button>

      </div>


      {/* ======================================
          MARKSHEET CANVAS
      ====================================== */}

      <div
        ref={printRef}
        style={{
          width: "1024px",
          height: "1536px",
          position: "relative",
          margin: "0 auto",
          overflow: "hidden",
          backgroundImage:
            "url('/internship-marksheet.png')",
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      >



 {/* ====================================
    FRANCHISE LOGO
==================================== */}

{/* ====================================
    FRANCHISE LOGO
==================================== */}

{student.logo && (

  <img
    src={student.logo}
    alt="Franchise Logo"
    crossOrigin="anonymous"
    style={{
      position: "absolute",

      left: "70px",
      top: "155px",

      width: "100px",
      height: "100px",

      objectFit: "contain",

      zIndex: 20
    }}
  />

)}


 <div
          style={{
            position: "absolute",
            left: "200px",
            top: "170px",
            width: "800px",
            fontSize: "40px",
            fontWeight: "700",
            color: "#111",
            lineHeight: "30px"
          }}
        >
          {student.instituteName}
        </div>

        {/* ====================================
            STUDENT NAME
        ==================================== */}

        <div
          style={{
            position: "absolute",
            left: "290px",
            top: "290px",
            width: "300px",
            fontSize: "17px",
            fontWeight: "700",
            color: "#111",
            whiteSpace: "nowrap"
          }}
        >
          {student.studentName}
        </div>


        <div
          style={{
            position: "absolute",
            left: "290px",
            top: "318px",
            width: "360px",
            fontSize: "17px",
            fontWeight: "700",
            color: "#111",
            whiteSpace: "nowrap"
          }}
        >
          {student.fatherName || "-"}
        </div>
        {/* ====================================
            MOTHER NAME
        ==================================== */}

        <div
          style={{
            position: "absolute",
            left: "290px",
            top: "345px",
            width: "300px",
            fontSize: "17px",
            fontWeight: "700",
            color: "#111",
            whiteSpace: "nowrap"
          }}
        >
          {student.motherName || "-"}
        </div>


        {/* ====================================
            COURSE NAME
        ==================================== */}

        <div
          style={{
            position: "absolute",
            left: "290px",
            top: "398px",
            width: "300px",
            fontSize: "17px",
            fontWeight: "700",
            color: "#111",
            whiteSpace: "nowrap"
          }}
        >
          {student.internshipTitle}
        </div>


        {/* ====================================
            INSTITUTE NAME
        ==================================== */}

        <div
          style={{
            position: "absolute",
            left: "290px",
            top: "454px",
            width: "400px",
            fontSize: "17px",
            fontWeight: "700",
            color: "#111",
            lineHeight: "22px"
          }}
        >
          {student.instituteName}
        </div>


        {/* ====================================
            MARK SHEET NUMBER
        ==================================== */}

        <div
          style={{
            position: "absolute",
            left: "760px",
            top: "322px",
            width: "190px",
            fontSize: "16px",
            fontWeight: "700",
            color: "#111"
          }}
        >
          {marksheetNo}
        </div>


        {/* ====================================
            DATE OF BIRTH
        ==================================== */}

        <div
          style={{
            position: "absolute",
            left: "760px",
            top: "347px",
            width: "190px",
            fontSize: "16px",
            fontWeight: "700",
            color: "#111"
          }}
        >
          {formatDate(student.dateOfBirth)}
        </div>


        {/* ====================================
            COURSE PERIOD
        ==================================== */}

        <div
          style={{
            position: "absolute",
            left: "760px",
            top: "375px",
            width: "210px",
            fontSize: "15px",
            fontWeight: "700",
            color: "#111",
            whiteSpace: "nowrap"
          }}
        >
          {coursePeriod}
        </div>


        {/* ====================================
            FATHER NAME
            Added because your template
            doesn't have a Father Name field.
        ==================================== */}



        {/* ====================================
            SUBJECT ROWS
        ==================================== */}

        <div
          style={{
            position: "absolute",
            left: "90px",
            top: "580px",
            width: "844px"
          }}
        >

          {subjects.map(
            (subject, index) => {

              const rowHeight =
                subjects.length <= 8
                  ? 69
                  : subjects.length <= 10
                    ? 55
                    : 45


              return (

                <div
                  key={index}
                  style={{
                    height: `${rowHeight}px`,
                    display: "grid",
                    gridTemplateColumns:
                      "405px 69px 69px 69px 69px 69px 90px",
                    alignItems: "center",
                    fontSize:
                      subjects.length > 10
                        ? "22px"
                        : "20px",
                    fontWeight: "600",
                    color: "#111"
                  }}
                >

                  {/* SUBJECT */}

                  <div
                    style={{
                      paddingLeft: "20px",
                      paddingRight: "10px",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {subject.name}
                  </div>


                  {/* OBJECTIVE OUT OF */}

                  <div
                    style={{
                      textAlign: "center"
                    }}
                  >
                    50
                  </div>


                  {/* OBJECTIVE SCORED */}

                  <div
                    style={{
                      textAlign: "center"
                    }}
                  >
                    {subject.objective}
                  </div>


                  {/* PRACTICAL OUT OF */}

                  <div
                    style={{
                      textAlign: "center"
                    }}
                  >
                    50
                  </div>


                  {/* PRACTICAL SCORED */}

                  <div
                    style={{
                      textAlign: "center"
                    }}
                  >
                    {subject.practical}
                  </div>


                  {/* TOTAL OUT OF */}

                  <div
                    style={{
                      textAlign: "center"
                    }}
                  >
                    100
                  </div>


                  {/* TOTAL SCORED */}

                  <div
                    style={{
                      textAlign: "center"
                    }}
                  >
                    {getTotal(subject)}
                  </div>

                </div>

              )

            }
          )}

        </div>


  {/* ====================================
    TOTAL ROW
==================================== */}

<div
  style={{
    position: "absolute",
    left: "90px",
    top: "1150px",
    width: "844px",
    height: "60px",

    display: "grid",

    gridTemplateColumns:
      "405px 69px 69px 69px 69px 69px 90px",

    alignItems: "center",

    fontSize: "17px",
    fontWeight: "800",
    color: "#111"
  }}
>

  {/* ====================================
      EMPTY SUBJECT COLUMN
      TOTAL TEXT IS ALREADY IN TEMPLATE
  ==================================== */}

  <div></div>


  {/* ====================================
      OBJECTIVE - OUT OF
  ==================================== */}

  <div
    style={{
      textAlign: "center"
    }}
  >
    {subjects.length * 50}
  </div>


  {/* ====================================
      OBJECTIVE - SCORED
  ==================================== */}

  <div
    style={{
      textAlign: "center"
    }}
  >
    {
      subjects.reduce(
        (sum, subject) =>
          sum +
          Number(
            subject.objective || 0
          ),
        0
      )
    }
  </div>


  {/* ====================================
      PRACTICAL - OUT OF
  ==================================== */}

  <div
    style={{
      textAlign: "center"
    }}
  >
    {subjects.length * 50}
  </div>


  {/* ====================================
      PRACTICAL - SCORED
  ==================================== */}

  <div
    style={{
      textAlign: "center"
    }}
  >
    {
      subjects.reduce(
        (sum, subject) =>
          sum +
          Number(
            subject.practical || 0
          ),
        0
      )
    }
  </div>


  {/* ====================================
      TOTAL - OUT OF
  ==================================== */}

  <div
    style={{
      textAlign: "center"
    }}
  >
    {maximumMarks}
  </div>


  {/* ====================================
      TOTAL - SCORED
  ==================================== */}

  <div
    style={{
      textAlign: "center"
    }}
  >
    {totalMarks}
  </div>

</div>

        {/* ====================================
            PERCENTAGE
        ==================================== */}

        <div
          style={{
            position: "absolute",
            left: "600px",
            top: "1230px",
            width: "180px",
            textAlign: "center",
            fontSize: "16px",
            fontWeight: "800",
            color: "#111"
          }}
        >
          Percentage: {percentage.toFixed(2)}%
        </div>


        {/* ====================================
            GRADE
        ==================================== */}

        <div
          style={{
            position: "absolute",
            left: "400px",
            top: "1230px",
            width: "180px",
            textAlign: "center",
            fontSize: "16px",
            fontWeight: "800",
            color: "#111"
          }}
        >
          Grade: {grade}
        </div>


        {/* ====================================
            RESULT
        ==================================== */}

        <div
          style={{
            position: "absolute",
            left: "200px",
            top: "1230px",
            width: "180px",
            textAlign: "center",
            fontSize: "16px",
            fontWeight: "800",
            color: "#111"
          }}
        >
          Result:{" "}
          {percentage >= 40
            ? "PASS"
            : "FAIL"
          }
        </div>


      </div>

    </div>

  )

}