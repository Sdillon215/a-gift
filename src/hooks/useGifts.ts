import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Gift {
  id: string;
  title: string;
  message: string | null;
  imageUrl: string;
  blurDataUrl?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

// Simple in-memory cache to prevent duplicate requests
let giftsCache: Gift[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 30000; // 30 seconds

export function useGifts() {
  const { data: session, status } = useSession();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      setIsLoading(false);
      return;
    }

    // Check cache first
    const now = Date.now();
    if (giftsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      setGifts(giftsCache);
      setIsLoading(false);
      return;
    }

    // Fetch gifts
    const fetchGifts = async () => {
      try {
        const response = await fetch("/api/gifts", {
          cache: "no-store",
        });
        if (response.ok) {
          const data = await response.json();
          giftsCache = data.gifts || [];
          cacheTimestamp = Date.now();
          setGifts(giftsCache || []);
        } else {
          console.error("Failed to fetch gifts:", response.status, response.statusText);
        }
      } catch (error) {
        console.error("Error fetching gifts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGifts();
  }, [status, session?.user?.id]);

  // Function to invalidate cache (call after creating/updating/deleting gifts)
  const invalidateCache = () => {
    giftsCache = null;
    cacheTimestamp = 0;
  };

  return { gifts, isLoading, invalidateCache };
}

