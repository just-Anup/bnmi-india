"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { databases } from "@/lib/appwrite";
import { Stars } from "@react-three/drei";
import { FiArrowRight } from "react-icons/fi";
import {
  useMotionTemplate,
  useMotionValue,
  motion,
  animate,
} from "framer-motion";
import { useFrame } from "@react-three/fiber";
import Link from "next/link";

/* ================= CANVAS ================= */
const Canvas = dynamic(
  () => import("@react-three/fiber").then((mod) => mod.Canvas),
  { ssr: false }
);

const DB = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION = "website";

const COLORS_TOP = ["#13FFAA", "#1E67C6", "#CE84CF", "#DD335C"];

/* ================= CAMERA ================= */
function CameraParallax({ mouse }) {
  useFrame((state) => {
    const { camera } = state;

    camera.position.x += (mouse.x * 0.3 - camera.position.x) * 0.05;
    camera.position.y += (-mouse.y * 0.3 - camera.position.y) * 0.05;

    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ================= MAIN ================= */
export default function AuroraHero() {
  const color = useMotionValue(COLORS_TOP[0]);

  const [texts, setTexts] = useState([]);

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchCMS = async () => {
      try {
        const res = await databases.listDocuments(DB, COLLECTION);

        /* TEXTS */
        const textData = res.documents
          .filter((d) => d.type === "text")
          .map((d) => d.text);

        setTexts(textData);
      } catch (error) {
        console.error("CMS Fetch Error:", error);
      }
    };

    fetchCMS();
  }, []);

  /* ================= BG ================= */
  useEffect(() => {
    animate(color, COLORS_TOP, {
      duration: 10,
      repeat: Infinity,
      repeatType: "mirror",
    });
  }, [color]);

  /* ================= TYPING ================= */
  const [textIndex, setTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!texts.length) return;

    const current = texts[textIndex];

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setDisplayText(current.substring(0, charIndex + 1));
        setCharIndex((prev) => prev + 1);

        if (charIndex === current.length) {
          setTimeout(() => {
            setIsDeleting(true);
          }, 1200);
        }
      } else {
        setDisplayText(current.substring(0, charIndex - 1));
        setCharIndex((prev) => prev - 1);

        if (charIndex === 0) {
          setIsDeleting(false);
          setTextIndex((prev) => (prev + 1) % texts.length);
        }
      }
    }, isDeleting ? 40 : 80);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex, texts]);

  /* ================= MOUSE ================= */
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e) => {
      setMouse({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };

    window.addEventListener("mousemove", move);

    return () => window.removeEventListener("mousemove", move);
  }, []);

  const backgroundImage = useMotionTemplate`
    radial-gradient(125% 125% at 50% 0%, #020617 50%, ${color})
  `;

  return (
    <motion.section
      style={{ backgroundImage }}
      className="relative min-h-screen flex items-center justify-center text-white px-6 overflow-hidden"
    >
      {/* CONTENT */}
      <div className="relative z-10 grid md:grid-cols-2 gap-2 max-w-[1600px] w-full items-center">
        
        {/* LEFT */}
        <div className="pl-4 md:pl-16">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            {displayText}
          </h1>

          <p className="mt-6 text-gray-300 max-w-xl text-lg leading-8">
            BNMI is a leading educational institution dedicated to
            providing high-quality education and fostering a nurturing
            learning environment. This is the India's no. 1 franchise
            provider in the field of education.
          </p>

          <Link
            href="/franchise/signup"
            className="mt-8 px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center gap-2 hover:scale-105 transition w-[180px] text-lg font-semibold shadow-2xl"
          >
            Apply Now <FiArrowRight />
          </Link>
        </div>

        {/* RIGHT VIDEO */}
        <div className="flex justify-end w-full">
          
          <div className="w-full max-w-5xl relative ">
            
            <video
  autoPlay
  muted
  loop
  playsInline
  preload="auto"
  className="w-full h-full object-cover rounded-3xl shadow-2xl"
>
  <source src="/video.mp4" type="video/mp4" />
</video>

          </div>

        </div>
      </div>

      {/* BG CANVAS */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 1] }}>
          <CameraParallax mouse={mouse} />

          <Stars
            radius={50}
            count={2500}
            factor={4}
            fade
            speed={2}
          />
        </Canvas>
      </div>
    </motion.section>
  );
}