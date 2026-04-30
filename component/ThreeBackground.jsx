"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function Particles() {
  const ref = useRef();

  const particles = new Float32Array(5000 * 3).map(() => (Math.random() - 0.5) * 5);

  useFrame(() => {
    ref.current.rotation.x += 0.0005;
    ref.current.rotation.y += 0.0008;
  });

  return (
    <Points ref={ref} positions={particles}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.02}
        sizeAttenuation
        depthWrite={false}
      />
    </Points>
  );
}

export default function ThreeBackground() {
  return (
    <Canvas camera={{ position: [0, 0, 2] }}>
      <Particles />
    </Canvas>
  );
}