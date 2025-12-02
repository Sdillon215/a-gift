"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to appropriate page if already logged in
  useEffect(() => {
    const checkUserGiftsAndRedirect = async () => {
      if (status === "authenticated" && session?.user?.id) {
        // Check if user is admin and route accordingly
        if (session.user.email === "sdillon215@gmail.com") {
          router.push("/home");
          return;
        }
        
        // Check if user has already sent a gift
        try {
          const response = await fetch("/api/gifts", {
            cache: "no-store",
          });
          if (response.ok) {
            const data = await response.json();
            const userGifts = data.gifts?.filter((gift: { user: { id: string } }) => 
              gift.user.id === session.user.id
            ) || [];
            
            if (userGifts.length > 0) {
              router.push("/home");
            } else {
              router.push("/send-a-gift");
            }
          } else {
            // If API fails, default to send-a-gift
            router.push("/send-a-gift");
          }
        } catch {
          // If error, default to send-a-gift
          router.push("/send-a-gift");
        }
      }
    };
    
    checkUserGiftsAndRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!isLogin) {
      if (!formData.name) {
        newErrors.name = "Name is required";
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // Handle login
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          callbackUrl: "/home",
          redirect: false,
        });

        
        if (result?.error) {
          setErrors({ general: "Invalid credentials" });
        } else if (result?.ok) {
          // Check if user is admin and route accordingly
          if (formData.email === "sdillon215@gmail.com") {
            router.push("/home");
          } else {
            // Wait for session to update, then check if user has gifts
            setTimeout(async () => {
              try {
                const sessionRes = await fetch("/api/auth/session");
                if (sessionRes.ok) {
                  const sessionData = await sessionRes.json();
                  const userId = sessionData?.user?.id;
                  
                  if (userId) {
                    const giftsResponse = await fetch("/api/gifts", {
                      cache: "no-store",
                    });
                    if (giftsResponse.ok) {
                      const giftsData = await giftsResponse.json();
                      const userGifts = giftsData.gifts?.filter((gift: { user: { id: string } }) => 
                        gift.user.id === userId
                      ) || [];
                      
                      if (userGifts.length > 0) {
                        router.push("/home");
                      } else {
                        router.push("/send-a-gift");
                      }
                    } else {
                      router.push("/send-a-gift");
                    }
                  } else {
                    router.push("/send-a-gift");
                  }
                } else {
                  router.push("/send-a-gift");
                }
              } catch {
                router.push("/send-a-gift");
              }
            }, 200);
          }
        }
      } else {
        // Handle signup
        
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }),
        });


        if (response.ok) {
          
          // Auto sign in after successful registration
          const result = await signIn("credentials", {
            email: formData.email,
            password: formData.password,
            callbackUrl: "/home",
            redirect: false,
          });


          if (result?.error) {
            setErrors({ general: "Registration successful, but login failed" });
          } else if (result?.ok) {
            // New users always go to send-a-gift page
            router.push("/send-a-gift");
          }
        } else {
          const error = await response.json();
          setErrors({ general: error.message || "Registration failed" });
        }
      }
    } catch {
      setErrors({ general: "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
    });
    setErrors({});
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-20">
      {/* Glassy overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-emerald-900/20"></div>
      {/* Gem-like highlights */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-radial from-emerald-300/30 to-transparent rounded-full blur-xl"></div>
      <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-gradient-radial from-green-300/40 to-transparent rounded-full blur-lg"></div>
      <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-radial from-emerald-200/50 to-transparent rounded-full blur-md"></div>
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-gray-600">
            {isLogin ? "Sign in to your account" : "Sign up for a new account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {errors.general}
            </div>
          )}
          
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-colors text-gray-900 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-colors text-gray-900 ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-colors text-gray-900 ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-colors text-gray-900 ${
                  errors.confirmPassword ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Loading..." : (isLogin ? "Sign In" : "Sign Up")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={toggleMode}
              className="ml-2 text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>

        {isLogin && (
          <div className="mt-4 text-center">
            <a href="#" className="text-blue-600 hover:text-blue-700 text-sm">
              Forgot your password?
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
