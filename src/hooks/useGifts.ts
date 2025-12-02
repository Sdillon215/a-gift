import { useState, useEffect, useRef } from "react";
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

// Refresh trigger to force refetch when cache is invalidated
let refreshTrigger = 0;

// Export function to invalidate cache from anywhere
export function invalidateGiftsCache() {
  giftsCache = null;
  cacheTimestamp = 0;
  refreshTrigger = Date.now(); // Update trigger to force refetch
}

// Export function to get current refresh trigger value
export function getRefreshTrigger() {
  return refreshTrigger;
}

export function useGifts() {
  const { data: session, status } = useSession();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const lastTriggerRef = useRef(0);

  // Monitor refresh trigger changes
  useEffect(() => {
    const checkRefresh = () => {
      const currentTrigger = getRefreshTrigger();
      if (currentTrigger > 0 && currentTrigger !== lastTriggerRef.current) {
        lastTriggerRef.current = currentTrigger;
        setRefreshKey(currentTrigger);
      }
    };

    // Check immediately
    checkRefresh();

    // Check periodically for refresh trigger changes (every 300ms)
    const interval = setInterval(checkRefresh, 300);
    return () => clearInterval(interval);
  }, []); // Empty deps - we want this to run once and keep checking

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      setIsLoading(false);
      return;
    }

    // Fetch gifts function
    const fetchGifts = async () => {
      setIsLoading(true);
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

    // Check cache first (but only if refreshKey hasn't changed and cache is valid)
    const now = Date.now();
    if (refreshKey === 0 && giftsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      setGifts(giftsCache);
      setIsLoading(false);
    } else {
      // Always fetch if refreshKey changed or cache is invalid
      fetchGifts();
    }
  }, [status, session?.user?.id, refreshKey]);

  // Function to invalidate cache (call after creating/updating/deleting gifts)
  const invalidateCache = () => {
    giftsCache = null;
    cacheTimestamp = 0;
  };

  return { gifts, isLoading, invalidateCache };
}

