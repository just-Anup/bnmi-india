"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, useGLTF, Html } from "@react-three/drei";
import { FiArrowRight } from "react-icons/fi";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  animate,
} from "framer-motion";
import gsap from "gsap";
import { databases } from "@/lib/appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = "website";

/* ================= AUTO POSITION ================= */
function generatePositions(states) {
  const radius = 2.2;

  return states.map((state, index) => {
    const phi = Math.acos(-1 + (2 * index) / states.length);
    const theta = Math.sqrt(states.length * Math.PI) * phi;

    return {
      ...state,
      position: [
        radius * Math.cos(theta) * Math.sin(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(phi),
      ],
      institutes: state.institutes || [],
    };
  });
}

/* ================= STARS ================= */
function StarsBackground({ scrollY }) {
  const ref = useRef();

  useFrame((state) => {
    const { mouse } = state;

    if (ref.current) {
      ref.current.rotation.x +=
        (mouse.y * 0.3 - ref.current.rotation.x) * 0.05;
      ref.current.rotation.y +=
        (mouse.x * 0.5 - ref.current.rotation.y) * 0.05;
    }
  });

  return (
    <group ref={ref}>
      <Stars radius={50} count={2000} factor={4} fade speed={1} />
    </group>
  );
}

function StarCanvas({ scrollY }) {
  return (
    <Canvas camera={{ position: [0, 0, 50] }}>
      <StarsBackground scrollY={scrollY} />
    </Canvas>
  );
}

/* ================= WORLD MODEL ================= */
function WorldModel({ states, setActiveState }) {
  const { scene } = useGLTF("/models/world.glb");
  const ref = useRef();

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.003;
  });

  return (
    <group ref={ref}>
      <primitive object={scene} scale={2.5} />

      {states.map((state, i) => (
        <group key={i} position={state.position}>
          <Html distanceFactor={10}>
            <div
              onMouseEnter={() => setActiveState(state)}
              onMouseLeave={() => setActiveState(null)}
              className="text-xs px-2 py-1 bg-black/60 rounded cursor-pointer hover:bg-cyan-500 transition"
            >
              {state.name}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

function WorldCanvas({ states, setActiveState }) {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={1} />
      <Suspense fallback={null}>
        <WorldModel states={states} setActiveState={setActiveState} />
      </Suspense>
    </Canvas>
  );
}

/* ================= PARTICLES ================= */
function Particles() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      {Array.from({ length: 25 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full opacity-70"
          initial={{
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
          }}
          animate={{
            y: ["0%", "100%"],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 6 + Math.random() * 5,
            repeat: Infinity,
          }}
        />
      ))}
    </div>
  );
}

/* ================= TYPING ================= */
function TypingTextLoop() {
  const texts = [
    "BNMIIS India No.1 Franchise Provider",
    "Get QR Verification System",
    "Student Login & Certificate Access",
  ];

  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [del, setDel] = useState(false);

  useEffect(() => {
    const current = texts[index];
    const speed = del ? 40 : 60;

    const t = setTimeout(() => {
      if (!del) {
        setText(current.substring(0, text.length + 1));
        if (text === current) setTimeout(() => setDel(true), 1200);
      } else {
        setText(current.substring(0, text.length - 1));
        if (text === "") {
          setDel(false);
          setIndex((p) => (p + 1) % texts.length);
        }
      }
    }, speed);

    return () => clearTimeout(t);
  }, [text, del, index]);

  return (
    <h1 className="text-left text-3xl sm:text-5xl md:text-7xl font-semibold bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent min-h-[100px]">
      {text}
      <span className="animate-pulse ml-1">|</span>
    </h1>
  );
}

/* ================= HERO ================= */
export default function AuroraHero() {
  const sectionRef = useRef();
  const color = useMotionValue("#13FFAA");

  const [activeState, setActiveState] = useState(null);
  const [states, setStates] = useState([]);

  /* FETCH FROM APPWRITE */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID
        );

        const statesData = res.documents.filter(
          (d) => d.type === "state"
        );

        setStates(generatePositions(statesData));
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  /* ANIMATION */
  useEffect(() => {
    animate(color, ["#13FFAA", "#1E67C6"], {
      duration: 10,
      repeat: Infinity,
      repeatType: "mirror",
    });
  }, []);

  return (
  <section className="relative min-h-screen flex items-center bg-black text-white">

    {/* BG */}
    <motion.div
      style={{
        background: useMotionTemplate`
          radial-gradient(120% 120% at 50% 0%, #020617 40%, ${color})
        `,
      }}
      className="absolute inset-0"
    />

    {/* PARTICLES */}
    <Particles />

    {/* MAIN CONTENT WRAPPER */}
   <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex flex-col md:flex-row items-center justify-between gap-10">

      {/* LEFT SIDE TEXT */}
      <div className="max-w-3xl">

        <span className="inline-block mb-4 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-sm">
          Now Live
        </span>

        <TypingTextLoop />

        <p className="mt-6 text-gray-400 text-lg max-w-xl">
          Manage your franchise, students, QR verification and certificates in one powerful platform.
        </p>
      </div>

      {/* RIGHT SIDE GLOBE */}
     {/* 🌍 GLOBE FIRST ON MOBILE */}
<div className="relative w-full md:w-[45%] h-[350px] md:h-[500px] order-1 md:order-2 left-[60px]">

  <WorldCanvas states={states} setActiveState={setActiveState} />

  {/* 📋 LIST (MOBILE + DESKTOP) */}
  {activeState && activeState.institutes && (() => {
    const half = Math.ceil(activeState.institutes.length / 2);

    return (
      <>
        {/* LEFT */}
        <div className="absolute left-2 md:-left-30 top-1/2 -translate-y-1/2 w-40 md:w-64 space-y-2">
          {activeState.institutes.slice(0, half).map((name, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 px-2 py-1 text-[11px] md:text-xs rounded max-w-[140px] md:max-w-[180px]"
            >
              {name}
            </motion.div>
          ))}
        </div>

        {/* RIGHT */}
        <div className="absolute right-2 md:-right-20 top-1/2 -translate-y-1/2 w-40 md:w-64 space-y-2">
          {activeState.institutes.slice(half).map((name, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 px-2 py-1 text-[11px] md:text-xs rounded max-w-[140px] md:max-w-[180px]"
            >
              {name}
            </motion.div>
          ))}
        </div>
      </>
    );
  })()}

</div>



      </div>

  </section>
);
}