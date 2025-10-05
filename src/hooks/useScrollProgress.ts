"use client";

import { useEffect, useState } from 'react';

export function useScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      // Safety check to prevent NaN
      if (docHeight <= 0) {
        setScrollProgress(0);
        return;
      }
      
      const progress = Math.min(scrollTop / docHeight, 1);
      setScrollProgress(progress);
    };

    // Initial calculation
    updateScrollProgress();

    // Add scroll listener
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', updateScrollProgress, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('resize', updateScrollProgress);
    };
  }, []);

  return scrollProgress;
}
