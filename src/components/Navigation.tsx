"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useGifts } from "@/hooks/useGifts";

// Conditional import for framer-motion
let motion: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nav: React.ComponentType<any>;
};

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  motion = require("framer-motion").motion;
} catch {
  // Fallback if framer-motion is not installed
  motion = { 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nav: ({ children, ...props }: any) => <nav {...props}>{children}</nav> 
  };
}

export default function Navigation() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { gifts } = useGifts(); // Use shared hook to prevent duplicate requests
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useScrollProgress();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isDropdownOpen]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isMobileMenuOpen]);

  // Don't show navigation on login/signup page or when not authenticated
  if (status === "unauthenticated" || !session || pathname === "/") {
    return null;
  }

  // Check if the current user has a gift
  const userGift = gifts.find(gift => gift.user.id === session.user?.id);
  const hasGift = !!userGift;

  return (
    <motion.nav 
      className="relative p-4 md:p-6"
      style={{
        y: scrollProgress * -50, // Parallax effect for navbar
        zIndex: 1000,
        isolation: 'isolate'
      }}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="text-white cursor-pointer" onClick={() => router.push('/home')}>
          <h1 className="text-xl md:text-2xl font-bold">A-Gift</h1>
          <p className="text-sm text-emerald-100 hidden sm:block">Welcome back!</p>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="text-right text-white">
            <p className="font-medium">{session.user?.name || "User"}</p>
            <p className="text-sm text-emerald-100">{session.user?.email}</p>
          </div>
          
          {/* Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors border border-white/20 flex items-center space-x-2"
            >
              <span>Gift</span>
              <svg 
                className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-48 rounded-lg shadow-2xl border border-gray-200 overflow-hidden" 
                style={{ 
                  zIndex: 9999,
                  backgroundColor: '#ffffff',
                  isolation: 'isolate'
                }}
              >
                <button
                  onClick={() => {
                    if (hasGift && userGift) {
                      router.push(`/edit-gift/${userGift.id}`);
                    } else {
                      router.push('/send-a-gift');
                    }
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-gray-900 hover:bg-emerald-50 transition-colors flex items-center space-x-2"
                  style={{ backgroundColor: '#ffffff' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">{hasGift ? 'Edit Gift' : 'Send a Gift'}</span>
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors border border-white/20"
          >
            Sign Out
          </button>
        </div>

        {/* Mobile Hamburger Menu */}
        <div className="md:hidden" ref={mobileMenuRef}>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="bg-white/20 backdrop-blur-md text-white p-2 rounded-lg hover:bg-white/30 transition-colors border border-white/20"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div 
              className="absolute right-4 mt-2 w-64 rounded-lg shadow-2xl border border-gray-200 overflow-hidden" 
              style={{ 
                zIndex: 9999,
                backgroundColor: '#ffffff',
                isolation: 'isolate'
              }}
            >
              <div className="p-4 border-b border-gray-200" style={{ backgroundColor: '#f9fafb' }}>
                <p className="font-medium text-gray-900">{session.user?.name || "User"}</p>
                <p className="text-sm text-gray-700 truncate">{session.user?.email}</p>
              </div>
              
              <button
                onClick={() => {
                  if (hasGift && userGift) {
                    router.push(`/edit-gift/${userGift.id}`);
                  } else {
                    router.push('/send-a-gift');
                  }
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-gray-900 hover:bg-emerald-50 transition-colors flex items-center space-x-2 border-b border-gray-200 font-medium"
                style={{ backgroundColor: '#ffffff' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>{hasGift ? 'Edit Gift' : 'Send a Gift'}</span>
              </button>
              
              <button
                onClick={() => {
                  signOut({ callbackUrl: "/" });
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2 font-medium"
                style={{ backgroundColor: '#ffffff' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

