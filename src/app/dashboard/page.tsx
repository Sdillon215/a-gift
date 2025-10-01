"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-green-800 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-green-800 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Dashboard!
          </h1>
          <p className="text-gray-600">
            Hello, {session.user?.name || session.user?.email}!
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">User Information</h3>
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> {session.user?.email}
            </p>
            {session.user?.name && (
              <p className="text-sm text-gray-600">
                <strong>Name:</strong> {session.user.name}
              </p>
            )}
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
