
"use client";

import { useState, useEffect, useRef } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import {
  FiArrowUpRight,
  FiCheckCircle,
} from "react-icons/fi";

gsap.registerPlugin(ScrollTrigger);

const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

const COLLECTION_ID = "website";

export default function StagesSection() {
  const [data, setData] = useState(null);

  const sectionRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!databases || !DATABASE_ID) return;

        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID,
          [Query.limit(1)]
        );

        if (res.documents.length) {
          setData(res.documents[0]);
        }
      } catch (error) {
        console.error(
          "Stages load failed:",
          error
        );
      }
    };

    fetchData();
  }, []);

  /* ================= GSAP ================= */
  useEffect(() => {
    if (!sectionRef.current) return;

    gsap.fromTo(
      sectionRef.current.children,
      {
        opacity: 0,
        y: 100,
      },
      {
        opacity: 1,
        y: 0,
        duration: 1.4,
        stagger: 0.25,
        ease: "power4.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      }
    );
  }, [data]);

  if (!data) return null;

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#f8fafc] py-20">

      {/* BG */}
      <div className="absolute inset-0 bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] bg-[size:18px_18px] opacity-30" />

      <div className="absolute -top-20 left-0 h-[500px] w-[500px] rounded-full bg-blue-200/40 blur-[140px]" />

      <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-purple-200/40 blur-[140px]" />

      <div
        ref={sectionRef}
        className="
          relative
          mx-auto
          grid
          min-h-screen
          max-w-[1800px]
          grid-cols-1
          items-center
          gap-16
          px-6
          lg:grid-cols-[1.1fr_1fr]
        "
      >

        {/* ================= IMAGE SIDE ================= */}
        <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 py-10">

          {/* GLOW */}
          <div className="absolute left-10 top-1/2 h-[650px] w-[650px] -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-[140px]" />

          {/* IMAGE 1 */}
          <motion.div
            whileHover={{
              y: -8,
              scale: 1.02,
            }}
            transition={{
              duration: 0.4,
            }}
            className="
              relative
              z-30
              w-full
              max-w-[680px]
              overflow-hidden
              rounded-[42px]
              border
              border-white/40
              bg-white/30
              shadow-[0_30px_120px_rgba(0,0,0,0.18)]
              backdrop-blur-2xl
            "
          >
            <img
              src={data.aboutImageTop}
              className="
                h-[260px]
                w-full
                object-cover
              "
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          </motion.div>

          {/* IMAGE 2 */}
          <motion.div
            whileHover={{
              y: -8,
              scale: 1.02,
            }}
            transition={{
              duration: 0.4,
            }}
            className="
              relative
              z-30
              w-full
              max-w-[680px]
              overflow-hidden
              rounded-[42px]
              border
              border-white/40
              bg-white/30
              shadow-[0_30px_120px_rgba(0,0,0,0.18)]
              backdrop-blur-2xl
            "
          >
            <img
              src={data.aboutImageCenter}
              className="
                h-[260px]
                w-full
                object-cover
              "
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          </motion.div>

          {/* IMAGE 3 */}
          <motion.div
            whileHover={{
              y: -8,
              scale: 1.02,
            }}
            transition={{
              duration: 0.4,
            }}
            className="
              relative
              z-30
              w-full
              max-w-[680px]
              overflow-hidden
              rounded-[42px]
              border
              border-white/40
              bg-white/30
              shadow-[0_30px_120px_rgba(0,0,0,0.18)]
              backdrop-blur-2xl
            "
          >
            <img
              src={data.aboutImageBottom}
              className="
                h-[260px]
                w-full
                object-cover
              "
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          </motion.div>

          {/* FLOATING CARD */}
          {/* <motion.div
            initial={{
              opacity: 0,
              y: 40,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
            }}
            className="
              absolute
              bottom-15
              right-0
              z-40
              rounded-[32px]
              border
              border-white/30
              bg-white/75
              px-8
              py-6
              shadow-[0_10px_60px_rgba(0,0,0,0.1)]
              backdrop-blur-2xl
            "
          >
            <p className="text-sm font-medium text-gray-600">
              Trusted by Students
            </p>

            <h3 className="mt-1 text-6xl font-black text-black">
              10K+
            </h3>

            <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
              <FiCheckCircle />
              Growing Every Day
            </div>
          </motion.div> */}
        </div>

        {/* ================= CONTENT ================= */}
        <div className="flex min-h-screen flex-col justify-center">

          {/* TAG */}
          <div
            className="
              mb-5
              inline-flex
              w-fit
              items-center
              gap-2
              rounded-full
              border
              border-blue-200
              bg-blue-50
              px-5
              py-2
              text-sm
              font-semibold
              uppercase
              tracking-[0.25em]
              text-blue-600
            "
          >
            ABOUT US
          </div>

          {/* TITLE */}
          <h2
            className="
              mb-8
              max-w-4xl
              text-7xl
              font-black
              leading-[0.95]
              tracking-tight
              text-[#0f172a]
            "
          >
          </h2>

          {/* DESC */}
          <p
            className="
              mb-14
              max-w-5xl
              text-xl
              leading-[2]
              text-gray-600
            "
          >
            {data.aboutDescription}
          </p>

          {/* MISSION */}
          <motion.div
            whileHover={{
              y: -5,
            }}
            className="
              group
              relative
              mb-8
              w-full
              overflow-hidden
              rounded-[40px]
              border
              border-white/40
              bg-white/70
              p-10
              shadow-[0_10px_60px_rgba(0,0,0,0.08)]
              backdrop-blur-2xl
              transition
            "
          >

            <div className="absolute right-6 top-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white transition group-hover:rotate-45">
              <FiArrowUpRight size={22} />
            </div>

            <h3 className="mb-5 text-4xl font-black text-[#0f172a]">
              {data.missionTitle}
            </h3>

            <p className="max-w-6xl text-lg leading-[2] text-gray-600">
              {data.missionContent}
            </p>
          </motion.div>

          {/* VISION */}
          <motion.div
            whileHover={{
              y: -5,
            }}
            className="
              group
              relative
              w-full
              overflow-hidden
              rounded-[40px]
              border
              border-white/40
              bg-white/70
              p-10
              shadow-[0_10px_60px_rgba(0,0,0,0.08)]
              backdrop-blur-2xl
              transition
            "
          >

            <div className="absolute right-6 top-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white transition group-hover:rotate-45">
              <FiArrowUpRight size={22} />
            </div>

            <h3 className="mb-5 text-4xl font-black text-[#0f172a]">
              {data.visionTitle}
            </h3>

            <p className="max-w-6xl text-lg leading-[2] text-gray-600">
              {data.visionContent}
            </p>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
