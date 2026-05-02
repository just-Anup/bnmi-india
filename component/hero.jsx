"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, useGLTF, Html } from "@react-three/drei";
import { databases } from "@/lib/appwrite";
import { motion, useMotionTemplate, useMotionValue, animate } from "framer-motion";

/* ================= CONFIG ================= */
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = "website";

/* ================= TYPING ================= */
function TypingTextLoop() {
  const texts = [
    "BNMIIS India No.1 Franchise Provider",
    "Get QR Verification System",
    "Student Login & Certificate Access",
  ];

  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = texts[index];
    const speed = isDeleting ? 40 : 70;

    const timer = setTimeout(() => {
      setDisplay((prev) =>
        isDeleting
          ? current.substring(0, prev.length - 1)
          : current.substring(0, prev.length + 1)
      );

      if (!isDeleting && display === current) {
        setTimeout(() => setIsDeleting(true), 1200);
      }

      if (isDeleting && display === "") {
        setIsDeleting(false);
        setIndex((prev) => (prev + 1) % texts.length);
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [display, isDeleting, index]);

  return (
    <h1 className="text-3xl sm:text-5xl md:text-7xl font-semibold bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent min-h-[120px]">
      {display}
      <span className="animate-pulse ml-1">|</span>
    </h1>
  );
}

/* ================= PERFORMANCE DETECTION ================= */
function usePerformanceLevel() {
  const [level, setLevel] = useState("LOW");

  useEffect(() => {
    let frames = 0;
    let last = performance.now();

    function loop() {
      frames++;
      const now = performance.now();

      if (now - last >= 1000) {
        const fps = frames;

        if (fps > 50) setLevel("HIGH");
        else if (fps > 30) setLevel("MEDIUM");
        else setLevel("LOW");

        frames = 0;
        last = now;
      }

      requestAnimationFrame(loop);
    }

    loop();
  }, []);

  return level;
}

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

/* ================= WORLD ================= */
function WorldModel({ states, setActiveState, quality }) {
  const { scene } = useGLTF("/models/world.glb");
  const ref = useRef();

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.4;
  });

  return (
    <group ref={ref}>
      <primitive object={scene} scale={2.3} />

      {quality !== "LOW" &&
        states.map((state, i) => (
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
function GlobeCanvas({ states, setActiveState, quality }) {
  const starCount = quality === "HIGH" ? 400 : 200;

  return (
    <Canvas camera={{ position: [0, 0, 5] }} dpr={[1, 1.5]}>
      <ambientLight intensity={1} />
      <Stars radius={40} count={starCount} factor={3} fade />

      <Suspense
        fallback={
          <Html center>
            <div className="text-white">Loading...</div>
          </Html>
        }
      >
        <WorldModel
          states={states}
          setActiveState={setActiveState}
          quality={quality}
        />
      </Suspense>
    </Canvas>
  );
}

/* ================= STARS ================= */
function StarsOnly() {
  return (
    <Canvas>
      <Stars radius={40} count={200} factor={3} fade />
    </Canvas>
  );
}

/* ================= LAZY ================= */
const LazyGlobe = dynamic(() => Promise.resolve(GlobeCanvas), {
  ssr: false,
});
const LazyStars = dynamic(() => Promise.resolve(StarsOnly), {
  ssr: false,
});

/* ================= HERO ================= */
export default function AuroraHero() {
  const perf = usePerformanceLevel();
  const color = useMotionValue("#13FFAA");

  const [states, setStates] = useState([]);
  const [activeState, setActiveState] = useState(null);

  /* FETCH DATA */
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

  /* BACKGROUND ANIMATION */
  useEffect(() => {
    animate(color, ["#13FFAA", "#1E67C6", "#9333EA"], {
      duration: 10,
      repeat: Infinity,
      repeatType: "mirror",
    });
  }, []);

  /* SAFE PRELOAD */
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        useGLTF.preload("/models/world.glb");
      } catch {}
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center bg-black text-white overflow-hidden">

      {/* 🔥 BACKGROUND */}
      <motion.div
        style={{
          background: useMotionTemplate`
            radial-gradient(120% 120% at 50% 0%, #020617 40%, ${color})
          `,
        }}
        className="absolute inset-0 z-0"
      />

      <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-10 px-6">

        {/* LEFT */}
        <div className="max-w-3xl">
          <span className="mb-4 inline-block px-4 py-1 bg-white/10 rounded-full text-sm">
            Now Live
          </span>

          <TypingTextLoop />

          <p className="mt-6 text-gray-400 text-lg max-w-xl">
            Manage your franchise, students, QR verification and certificates in one platform.
          </p>
        </div>

        {/* RIGHT */}
        <div className="w-full md:w-[45%] h-[400px] relative">

          {perf === "HIGH" && (
            <LazyGlobe states={states} setActiveState={setActiveState} quality="HIGH" />
          )}

          {perf === "MEDIUM" && (
            <LazyGlobe states={states} setActiveState={setActiveState} quality="MEDIUM" />
          )}

          {perf === "LOW" && <LazyStars />}

          {/* INSTITUTES */}
          {perf !== "LOW" && activeState && activeState.institutes && (() => {
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