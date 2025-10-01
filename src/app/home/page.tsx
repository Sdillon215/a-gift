"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log("Home page - Session status:", status);
    console.log("Home page - Session data:", session);
    
    if (status === "unauthenticated") {
      console.log("Redirecting to login page");
      router.push("/");
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-green-800 relative overflow-hidden">
      {/* Glassy overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-emerald-900/20"></div>
      
      {/* Gem-like highlights */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-radial from-emerald-300/30 to-transparent rounded-full blur-xl"></div>
      <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-gradient-radial from-green-300/40 to-transparent rounded-full blur-lg"></div>
      <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-radial from-emerald-200/50 to-transparent rounded-full blur-md"></div>
      
      {/* Navigation */}
      <nav className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-white">
            <h1 className="text-2xl font-bold">A-Gift</h1>
            <p className="text-emerald-100">Welcome back!</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right text-white">
              <p className="font-medium">{session.user?.name || "User"}</p>
              <p className="text-sm text-emerald-100">{session.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors border border-white/20"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Welcome to A-Gift
            </h2>
            <p className="text-xl text-emerald-100 max-w-2xl mx-auto">
              Your personalized gift discovery platform. Find the perfect gifts for your loved ones.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-colors">
              <div className="text-3xl mb-4">🎁</div>
              <h3 className="text-xl font-semibold text-white mb-2">Gift Discovery</h3>
              <p className="text-emerald-100">Find unique and personalized gifts based on interests and preferences.</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-colors">
              <div className="text-3xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-white mb-2">Wishlist Sharing</h3>
              <p className="text-emerald-100">Create and share wishlists with friends and family.</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-colors">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-white mb-2">Smart Recommendations</h3>
              <p className="text-emerald-100">Get AI-powered gift suggestions tailored to your relationships.</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-semibold text-white mb-6 text-center">Quick Actions</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="bg-white/20 backdrop-blur-md text-white px-6 py-4 rounded-lg hover:bg-white/30 transition-colors border border-white/20 text-center">
                <div className="text-2xl mb-2">🎁</div>
                <p className="font-medium">Browse Gifts</p>
              </button>
              
              <button className="bg-white/20 backdrop-blur-md text-white px-6 py-4 rounded-lg hover:bg-white/30 transition-colors border border-white/20 text-center">
                <div className="text-2xl mb-2">📝</div>
                <p className="font-medium">Create Wishlist</p>
              </button>
              
              <button className="bg-white/20 backdrop-blur-md text-white px-6 py-4 rounded-lg hover:bg-white/30 transition-colors border border-white/20 text-center">
                <div className="text-2xl mb-2">👥</div>
                <p className="font-medium">Find Friends</p>
              </button>
              
              <button className="bg-white/20 backdrop-blur-md text-white px-6 py-4 rounded-lg hover:bg-white/30 transition-colors border border-white/20 text-center">
                <div className="text-2xl mb-2">⚙️</div>
                <p className="font-medium">Settings</p>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-12 bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-semibold text-white mb-6">Recent Activity</h3>
            <div className="space-y-4">
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">🎁</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Welcome to A-Gift!</p>
                    <p className="text-emerald-100 text-sm">Your account has been created successfully.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">✨</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Get Started</p>
                    <p className="text-emerald-100 text-sm">Complete your profile to get personalized recommendations.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
