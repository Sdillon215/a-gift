"use client";

import { useRef, useMemo } from 'react';

// Check if React Three Fiber packages are available
const hasReactThreeFiber = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@react-three/fiber');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@react-three/drei');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('three');
    return true;
  } catch {
    return false;
  }
})();

// Import React Three Fiber components only if available
let Canvas: any, useFrame: any, Stars: any;
if (hasReactThreeFiber) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const r3f = require('@react-three/fiber');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const drei = require('@react-three/drei');
  Canvas = r3f.Canvas;
  useFrame = r3f.useFrame;
  Stars = drei.Stars;
} else {
  Canvas = ({ children }: any) => <div>{children}</div>;
  useFrame = () => {};
  Stars = () => null;
}

interface StarfieldProps {
  scrollProgress: number;
}

// 3D Scene component - only renders when React Three Fiber is available
function StarfieldScene({ scrollProgress }: StarfieldProps) {
  if (!hasReactThreeFiber) {
    return null;
  }

  // Dynamic imports for Three.js types
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const THREE = require('three');
  
  const starsRef = useRef<any>(null);
  const nebulaRef = useRef<any>(null);

  // Generate random star positions
  const starPositions = useMemo(() => {
    const positions = new Float32Array(10000 * 3);
    for (let i = 0; i < 10000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2000;
    }
    return positions;
  }, []);

  // Generate star colors
  const starColors = useMemo(() => {
    const colors = new Float32Array(10000 * 3);
    for (let i = 0; i < 10000; i++) {
      const color = new THREE.Color();
      // Mix of white, blue, and purple stars
      const rand = Math.random();
      if (rand < 0.7) {
        color.setHex(0xffffff); // White stars
      } else if (rand < 0.85) {
        color.setHex(0x87ceeb); // Sky blue stars
      } else {
        color.setHex(0xdda0dd); // Plum colored stars
      }
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return colors;
  }, []);

  useFrame((state: any) => {
    if (starsRef.current) {
      // Move stars based on scroll progress
      const zOffset = scrollProgress * 1000;
      starsRef.current.position.z = zOffset;
      
      // Slow rotation for dynamic effect
      starsRef.current.rotation.y += 0.0005;
    }

    if (nebulaRef.current) {
      // Subtle nebula rotation
      nebulaRef.current.rotation.z += 0.0002;
      nebulaRef.current.rotation.y += 0.0003;
    }
  });

  // Use any type for JSX elements to avoid TypeScript errors
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const JSX = require('react').createElement;

  return JSX('group', null,
    // Custom starfield
    JSX('points', { ref: starsRef },
      JSX('bufferGeometry', null,
        JSX('bufferAttribute', {
          attach: "attributes-position",
          count: 10000,
          array: starPositions,
          itemSize: 3
        }),
        JSX('bufferAttribute', {
          attach: "attributes-color",
          count: 10000,
          array: starColors,
          itemSize: 3
        })
      ),
      JSX('pointsMaterial', {
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
      })
    ),

    // Additional stars from drei for depth
    JSX(Stars, {
      radius: 1000,
      depth: 500,
      count: 5000,
      factor: 4,
      saturation: 0,
      fade: true,
      speed: 0.5
    }),

    // Nebula-like effect
    JSX('mesh', { ref: nebulaRef, position: [0, 0, -200] },
      JSX('sphereGeometry', { args: [300, 32, 32] }),
      JSX('meshBasicMaterial', {
        color: "#4a148c",
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide
      })
    ),

    // Additional distant nebula
    JSX('mesh', { position: [200, -100, -400] },
      JSX('sphereGeometry', { args: [150, 16, 16] }),
      JSX('meshBasicMaterial', {
        color: "#1a237e",
        transparent: true,
        opacity: 0.05,
        side: THREE.BackSide
      })
    ),

    // Ambient lighting
    JSX('ambientLight', { intensity: 0.2 })
  );
}

export default function Starfield({ scrollProgress }: StarfieldProps) {
  if (!hasReactThreeFiber) {
    // Fallback: CSS-based starfield animation
    return (
      <div className="fixed inset-0 z-0 bg-black overflow-hidden">
        {/* CSS-based starfield fallback */}
        <div className="absolute inset-0">
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                transform: `translateZ(${scrollProgress * 100}px)`,
              }}
            />
          ))}
        </div>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 via-transparent to-green-900/20"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 0], fov: 75 }}
        style={{ background: 'transparent' }}
      >
        <StarfieldScene scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  );
}
