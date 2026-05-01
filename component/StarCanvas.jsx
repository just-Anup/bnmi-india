"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";

function StarsBackground() {
  const groupRef = useRef();

  useFrame((state) => {
    const { mouse } = state;

    if (groupRef.current) {
      groupRef.current.rotation.x +=
        (mouse.y * 0.3 - groupRef.current.rotation.x) * 0.05;

      groupRef.current.rotation.y +=
        (mouse.x * 0.5 - groupRef.current.rotation.y) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <Stars radius={50} count={2500} factor={4} fade speed={2} />
    </group>
  );
}

export default function StarCanvas() {
  return (
    <Canvas camera={{ position: [0, 0, 50] }}>
      <StarsBackground />
    </Canvas>
  );
}