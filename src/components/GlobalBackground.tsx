"use client";

import Starfield from "@/components/Starfield";
import { useScrollProgress } from "@/hooks/useScrollProgress";

export default function GlobalBackground() {
  const scrollProgress = useScrollProgress();

  return (
    <>
      {/* 3D Starfield Background */}
      <Starfield scrollProgress={scrollProgress} />
      
      {/* Overlay gradient for better text readability */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-900/50 via-transparent to-green-900/35 z-10 pointer-events-none"></div>
    </>
  );
}
