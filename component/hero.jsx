"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, useGLTF, Html } from "@react-three/drei";
import { motion, useMotionTemplate, useMotionValue, animate } from "framer-motion";
import { databases } from "@/lib/appwrite";

/* ================= CONFIG ================= */
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = "website";

/* ================= MOBILE DETECTION ================= */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
};

/* ================= POSITION ================= */
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

/* ================= WORLD MODEL ================= */
function WorldModel({ states, setActiveState }) {
  const { scene } = useGLTF("/models/world.glb");
  const ref = useRef();

  // 🔥 Smooth rotation (optimized)
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group ref={ref}>
      <primitive object={scene} scale={2.3} />

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

/* ================= CANVAS ================= */
function WorldCanvas({ states, setActiveState }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5] }}
      frameloop="always"   // 🔥 needed for rotation
      dpr={[1, 1.5]}       // performance control
    >
      <ambientLight intensity={1} />

      {/* ⭐ optimized stars */}
      <Stars radius={40} count={300} factor={3} fade />

      <Suspense fallback={null}>
        <WorldModel states={states} setActiveState={setActiveState} />
      </Suspense>
    </Canvas>
  );
}

/* ================= LAZY LOAD ================= */
const LazyWorld = dynamic(() => Promise.resolve(WorldCanvas), {
  ssr: false,
});

/* ================= PARTICLES ================= */
function Particles() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full opacity-60"
          initial={{
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
          }}
          animate={{ y: ["0%", "100%"], opacity: [0, 1, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

/* ================= HERO ================= */
export default function AuroraHero() {
  const color = useMotionValue("#13FFAA");

  const isMobile = useIsMobile();
  const [activeState, setActiveState] = useState(null);
  const [states, setStates] = useState([]);

  /* FETCH DATA */
  useEffect(() => {
    const fetchData = async () => {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
      const statesData = res.documents.filter((d) => d.type === "state");
      setStates(generatePositions(statesData));
    };
    fetchData();
  }, []);

  /* BG ANIMATION */
  useEffect(() => {
    animate(color, ["#13FFAA", "#1E67C6"], {
      duration: 8,
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

      <Particles />

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex flex-col md:flex-row items-center justify-between gap-10">

        {/* LEFT */}
        <div className="max-w-3xl">
          <span className="mb-4 inline-block px-4 py-1 bg-white/10 rounded-full text-sm">
            Now Live
          </span>

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-semibold bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
            BNMIIS India No.1 Franchise Provider
          </h1>

          <p className="mt-6 text-gray-400 text-lg max-w-xl">
            Manage your franchise, students, QR verification and certificates in one platform.
          </p>
        </div>

        {/* RIGHT */}
        <div className="relative w-full md:w-[45%] h-[350px] md:h-[500px]">

          {/* MOBILE FALLBACK (OPTIONAL BUT SMART) */}
          {isMobile ? (
            <img
              src="/globe.png"
              alt="globe"
              className="w-full h-full object-contain opacity-80"
            />
          ) : (
            <LazyWorld states={states} setActiveState={setActiveState} />
          )}

          {/* 🔥 INSTITUTES LIST (SAME AS YOUR OLD UI) */}
          {activeState && activeState.institutes && (() => {
            const half = Math.ceil(activeState.institutes.length / 2);

            return (
              <>
                <div className="absolute left-2 md:-left-24 top-1/2 -translate-y-1/2 w-40 md:w-60 space-y-2">
                  {activeState.institutes.slice(0, half).map((name, i) => (
                    <div key={i} className="bg-white/10 px-2 py-1 text-xs rounded">
                      {name}
                    </div>
                  ))}
                </div>

                <div className="absolute right-2 md:-right-20 top-1/2 -translate-y-1/2 w-40 md:w-60 space-y-2">
                  {activeState.institutes.slice(half).map((name, i) => (
                    <div key={i} className="bg-white/10 px-2 py-1 text-xs rounded">
                      {name}
                    </div>
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

/* PRELOAD */
setTimeout(() => {
  useGLTF.preload("/models/world.glb");
}, 2000);