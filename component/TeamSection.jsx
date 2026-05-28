"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { databases, storage } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

const COLLECTION_ID = "team";

const BUCKET_ID =
  process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID;

export default function TeamSlider() {
  const [team, setTeam] = useState([]);
  const [isPaused, setIsPaused] =
    useState(false);

  /* ================= FETCH TEAM ================= */

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res =
          await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [Query.orderAsc("order")]
          );

        setTeam(res.documents || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchTeam();
  }, []);

  /* ================= IMAGE URL ================= */

  const getImageUrl = (image) => {
    if (!image) return "/placeholder.png";

    try {
      if (
        typeof image === "string" &&
        image.startsWith("http")
      ) {
        return image;
      }

      if (typeof image === "string") {
        return storage.getFileView(
          BUCKET_ID,
          image
        ).href;
      }

      if (typeof image === "object") {
        const id =
          image.$id ||
          image.fileId ||
          image.id;

        if (id) {
          return storage.getFileView(
            BUCKET_ID,
            id
          ).href;
        }
      }

      return "/placeholder.png";
    } catch {
      return "/placeholder.png";
    }
  };

  /* ================= LOADING ================= */

  if (!team.length) {
    return (
      <section className="py-16 text-center text-white bg-[#1e1e1e]">
        Loading team...
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-[#1e1e1e] py-20 text-white">

      {/* BACKGROUND */}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12),transparent_65%)]" />

      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[140px]" />

      {/* CONTENT */}

      <div className="relative z-10 max-w-7xl mx-auto px-4">

        {/* HEADING */}

        <div className="text-center mb-14">

          <h2 className="text-4xl md:text-5xl font-bold">
            Our{" "}
            <span className="text-cyan-400">
              Team
            </span>
          </h2>

          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            Meet the creative minds and skilled professionals
            powering our vision forward.
          </p>
        </div>

        {/* LEFT FADE */}

        <div className="absolute left-0 top-0 z-20 h-full w-32 bg-gradient-to-r from-[#1e1e1e] to-transparent pointer-events-none" />

        {/* RIGHT FADE */}

        <div className="absolute right-0 top-0 z-20 h-full w-32 bg-gradient-to-l from-[#1e1e1e] to-transparent pointer-events-none" />

        {/* ================= SLIDER ================= */}

        <div
          className="overflow-hidden"
          onMouseEnter={() =>
            setIsPaused(true)
          }
          onMouseLeave={() =>
            setIsPaused(false)
          }
        >

          <motion.div
            animate={{
              x: isPaused
                ? undefined
                : ["0%", "-50%"],
            }}
            transition={{
              repeat: Infinity,
              duration: 35,
              ease: "linear",
            }}
            className="
              flex
              min-w-max
              items-center
              gap-8
              pr-8
            "
          >

            {[...team, ...team].map(
              (member, index) => (
                <motion.div
                  key={index}
                  whileHover={{
                    y: -10,
                    scale: 1.03,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 220,
                    damping: 16,
                  }}
                  className="
                    relative
                    overflow-hidden
                    rounded-[32px]
                    border
                    border-white/10
                    bg-black
                    shadow-[0_10px_60px_rgba(0,0,0,0.45)]
                    w-[320px]
                    flex-shrink-0
                  "
                >

                  {/* GLOW */}

                  <div className="absolute inset-0 opacity-0 transition duration-700 hover:opacity-100">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-cyan-500/20 blur-3xl" />
                  </div>

                  {/* IMAGE */}

                  <div className="relative overflow-hidden p-3">

                    <img
                      src={getImageUrl(
                        member.imageUrl
                      )}
                      alt={member.name}
                      draggable={false}
                      className="
  w-full
  h-[260px]
  md:h-[320px]
  object-cover
  object-top
  rounded-[26px]
  transition-transform
  duration-500
  hover:scale-105
"
                    />

                    <div className="absolute inset-0 rounded-[26px] bg-cyan-500/0 hover:bg-cyan-500/10 transition duration-500" />
                  </div>

                  {/* CONTENT */}

                  <div className="p-5 text-center relative z-10">

                    <h4 className="font-bold text-xl">
                      {member.name}
                    </h4>

                    <p className="text-cyan-400 text-sm mt-2">
                      {member.role}
                    </p>

                    <p className="text-gray-400 text-xs mt-3 leading-relaxed">
                      {member.experience}
                    </p>

                  </div>
                </motion.div>
              )
            )}

          </motion.div>
        </div>
      </div>
    </section>
  );
}