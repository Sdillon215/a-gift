"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
// Conditional import for framer-motion
let motion: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  div: React.ComponentType<any>;
};

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  motion = require("framer-motion").motion;
} catch {
  // Fallback if framer-motion is not installed
  motion = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  };
}
import GiftCard from "@/components/GiftCard";
import { useScrollProgress } from "@/hooks/useScrollProgress";

interface Gift {
  id: string;
  title: string;
  message: string;
  imageUrl: string;
  blurDataUrl?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [giftsLoading, setGiftsLoading] = useState(true);
  const scrollProgress = useScrollProgress();

  const fetchGifts = async () => {
    try {
      const response = await fetch("/api/gifts");
      if (response.ok) {
        const data = await response.json();
        setGifts(data.gifts || []);
      } else {
        console.error("Failed to fetch gifts");
      }
    } catch (error) {
      console.error("Error fetching gifts:", error);
    } finally {
      setGiftsLoading(false);
    }
  };

  useEffect(() => {

    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      fetchGifts();
    }
  }, [status, router, session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-green-800 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="relative z-20">

      {/* Main Content with Parallax Effects */}
      <motion.div
        className="relative z-20 px-4 md:px-6 pb-20"
        style={{
          y: scrollProgress * -100, // Stronger parallax for content
        }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <motion.div
            className="text-center mb-12 md:mb-16 pt-12 md:pt-20"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4 md:mb-6 px-4">
              Happy Birthday Ashley!
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-emerald-100 max-w-2xl mx-auto px-4">
              You are such a bright light in the universe and have such a positive influence on the world!
            </p>
            <p className="text-base sm:text-lg md:text-xl text-emerald-100 max-w-2xl mx-auto pt-4 px-4">
              The joy and love that you spread is immeasurable. The playful energy you embody is contagious. The impact that you have on those around you is nothing short of beautiful.
            </p>
            <p className="text-base sm:text-lg md:text-xl text-emerald-100 max-w-2xl mx-auto pt-4 px-4">
              For your birthday this year I wanted to create a meaningful gift to remind you of the incredible impact you have. However, I couldn&apos;t create this gift alone.

            </p>
          </motion.div>

          {/* Gifts Introduction */}
          <motion.div
            className="text-center mb-12 md:mb-16 px-4"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h3 className="text-xl sm:text-2xl md:text-2xl font-bold text-emerald-100 mb-4 md:mb-6">Scroll through the stars to see how far your light shines 💚</h3>
            {giftsLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <span className="ml-3 text-white">Loading gifts...</span>
              </div>
            )}
            {!giftsLoading && gifts.length === 0 && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎁</div>
                <p className="text-white/70 text-lg">No gifts shared yet</p>
                <p className="text-white/50 text-sm mt-2">Be the first to share a gift with the community!</p>
              </div>
            )}
          </motion.div>

          {/* Individual Gift Cards Spaced Throughout */}
          {!giftsLoading && gifts.length > 0 && gifts.map((gift, index) => (
            <motion.div
              key={gift.id}
              className="flex justify-center mb-20 md:mb-32 px-4"
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="border-white/20 w-full max-w-lg">
                <GiftCard gift={gift} />
              </div>
            </motion.div>
          ))}

          {/* Continue Your Journey Section */}
          <motion.div
            className="mt-32 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h3 className="text-3xl font-bold text-white mb-6">Continue Your Journey</h3>
            <p className="text-emerald-100 text-lg mb-8">
              The deeper you scroll, the further into the starfield you travel
            </p>
            <div className="h-96 flex items-center justify-center">
              <motion.div
                className="text-8xl"
                animate={{
                  rotate: 360,
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                🌌
              </motion.div>
            </div>
          </motion.div>

          {/* Deeper Into Space Section */}
          <div className="h-screen flex items-center justify-center mt-32">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <h3 className="text-4xl font-bold text-white mb-6">Deeper Into Space</h3>
              <p className="text-emerald-100 text-xl">
                You&apos;ve traveled far into the cosmic gift universe
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
