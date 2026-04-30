"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, useGLTF } from "@react-three/drei";
import { FiArrowRight } from "react-icons/fi";
import { motion, useMotionTemplate, useMotionValue, animate } from "framer-motion";
import gsap from "gsap";
import { Html } from "@react-three/drei";

/* ================= COLORS ================= */
const COLORS_TOP = ["#13FFAA", "#1E67C6", "#CE84CF", "#DD335C"];

/* ================= STARS ================= */
function StarsBackground({ scrollY }) {
  const ref = useRef();

  useFrame((state) => {
    const { mouse } = state;

    if (ref.current) {
      ref.current.rotation.x += (mouse.y * 0.3 - ref.current.rotation.x) * 0.05;
      ref.current.rotation.y += (mouse.x * 0.5 - ref.current.rotation.y) * 0.05;

      // scroll parallax
      ref.current.position.y = scrollY.current * 0.02;
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
    <Canvas camera={{ position: [0, 0, 50] }} dpr={[1, 1.5]}>
      <StarsBackground scrollY={scrollY} />
    </Canvas>
  );
}

const STATES = [
  {
    name: "Assam",
    position: [1.2, 0.6, 1.8],
    institutes: [
    
      "AM Unisex Salon",
      "Computer Idea Institute",
      "Multination Computer Academy",
      "Future Tech Institute",
      "Bright Career Academy",
      "Smart Skill Centre",
      "Digital Learning Hub",
      "EduTech Assam",
      "Global Computer Training",
      "SkillUp Institute",
      "Assam IT Academy",
      "Tech Vision Institute",
      "NextGen Learning Centre",
      "ProSkill Institute",
      "Career Boost Academy",
      "Knowledge Hub Assam",
      "Advanced Computer School",
      "Skill Development Centre",
      "Modern IT Institute",
      "Professional Training Hub"
    ]
  },

  {
    name: "Delhi",
    position: [0.5, 1.2, 2],
    institutes: [
      "OUR TOP INSTITUTES",
      "Delhi Computer Institute",
      "Skill India Training Center",
      "Tech Guru Academy",
      "Digital Delhi Institute",
      "Smart Career Hub",
      "Future IT Academy",
      "Delhi Skill Centre",
      "Advance Tech Institute",
      "Urban Learning Hub",
      "Computer World Delhi",
      "Elite IT Academy",
      "Pro Digital Institute",
      "Skill Boost Delhi",
      "Career Maker Institute",
      "Bright Future Delhi",
      "EduSmart Centre",
      "Global Skill Academy",
      "Tech Advance Delhi",
      "IT Training Hub",
      "Next Level Institute"
    ]
  },

  {
    name: "Mumbai",
    position: [0.2, 0.5, 2],
    institutes: [
    "OUR TOP INSTITUTES",
      "Mumbai IT Academy",
      "Tech Skill Mumbai",
      "Digital Training Hub",
      "Future Vision Institute",
      "SkillUp Mumbai",
      "Computer Pro Academy",
      "Smart Tech Centre",
      "Urban Skill Institute",
      "IT Hub Mumbai",
      "NextGen Tech",
      "Advance Learning Mumbai",
      "Career IT Centre",
      "Modern Tech Academy",
      "Professional Skill Hub",
      "Bright IT Institute",
      "EduTech Mumbai",
      "Skill Booster Mumbai",
      "Digital Pro Institute",
      "Tech Master Academy",
      "Global Learning Mumbai"
    ]
  }
];

/* ================= WORLD MODEL ================= */
function WorldModel({ setActiveState }) {
  const { scene } = useGLTF("/models/world.glb");
  const ref = useRef();

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.003;
    }
  });

  return (
    <group ref={ref}>
      <primitive object={scene} scale={2.5} position={[0, 0, 0]} />

      {/* STATES LABELS (HOVER HERE) */}
      {STATES.map((state, i) => (
        <group key={i} position={state.position}>

          {/* 👉 LABEL */}
          <Html distanceFactor={10}>
            <div
              onMouseEnter={() => setActiveState(state)}
              onMouseLeave={() => setActiveState(null)}
              className={`text-xs px-2 py-1 rounded-md cursor-pointer transition ${
                state.name === state?.name
                  ? "bg-black/60 text-white"
                  : "bg-black/60 text-white"
              }`}
            >
              {state.name}
            </div>
          </Html>

        </group>
      ))}
    </group>
  );
}

function WorldCanvas({ setActiveState }) {
  return (
    <Canvas camera={{ position: [0, 0, 5] }} dpr={[1, 1.5]}>
      <ambientLight intensity={1} />
      <Suspense fallback={null}>
        <WorldModel setActiveState={setActiveState} />
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
    const speed = del ? 40 : 80;

    const t = setTimeout(() => {
      if (!del) {
        setText(current.substring(0, text.length + 1));
        if (text === current) setTimeout(() => setDel(true), 1000);
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
  const scrollY = useRef(0);
  const color = useMotionValue(COLORS_TOP[0]);
  const [activeState, setActiveState] = useState(null);

  /* Aurora animation */
  useEffect(() => {
    animate(color, COLORS_TOP, {
      duration: 10,
      repeat: Infinity,
      repeatType: "mirror",
    });
  }, []);

  /* Scroll tracking */
  useEffect(() => {
    const handleScroll = () => {
      scrollY.current = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* GSAP animation */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-item", {
        y: 80,
        opacity: 0,
        stagger: 0.2,
        duration: 1.2,
        ease: "power3.out",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  /* Mouse spotlight */
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  return (
    <section
      ref={sectionRef}
      onMouseMove={(e) => setMouse({ x: e.clientX, y: e.clientY })}
      style={{
        background: `radial-gradient(circle at ${mouse.x}px ${mouse.y}px, rgba(255,255,255,0.12), transparent 40%)`,
      }}
      className="relative min-h-screen flex items-center overflow-hidden bg-black text-white"
    >
      {/* Aurora */}
      <motion.div
        style={{
          background: useMotionTemplate`
            radial-gradient(120% 120% at 50% 0%, #020617 40%, ${color})
          `,
        }}
        className="absolute inset-0 z-0"
      />

      {/* Stars */}
      <div className="absolute inset-0 z-0">
        <StarCanvas scrollY={scrollY} />
      </div>

      {/* Particles */}
      <Particles />

      {/* CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex items-center justify-between">

        {/* LEFT SIDE */}
        <div className="max-w-xl">

          <span className="hero-item inline-block mb-4 px-3 py-1 bg-white/10 rounded-full text-sm">
            Now Live
          </span>

          <div className="hero-item">
            <TypingTextLoop />
          </div>

          <p className="hero-item mt-6 text-gray-400">
            Manage your franchise, students, QR verification and certificates in one powerful platform.
          </p>

          <button className="hero-item mt-8 px-6 py-3 rounded-full border border-white/30 hover:bg-white/10 transition flex items-center gap-2">
            Get Started <FiArrowRight />
          </button>
        </div>

        {/* RIGHT SIDE 3D MODEL */}
        <div className="hidden md:block w-[40%] h-[500px]">
          <WorldCanvas setActiveState={setActiveState} />
        </div>

      </div>

      {activeState && (
  <>
    {/* LEFT SIDE */}
    <div className="absolute left-5 top-1/2 -translate-y-1/2 w-64 space-y-2 z-20">
      {activeState.institutes.slice(0, 10).map((name, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-white/10 px-3 py-2 rounded-lg text-sm backdrop-blur"
        >
          {name}
        </motion.div>
      ))}
    </div>

    {/* RIGHT SIDE */}
    <div className="absolute right-5 top-1/2 -translate-y-1/2 w-64 space-y-2 z-20">
      {activeState.institutes.slice(10, 20).map((name, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-white/10 px-3 py-2 rounded-lg text-sm backdrop-blur"
        >
          {name}
        </motion.div>
      ))}
    </div>
  </>
)}
    </section>
  );
}