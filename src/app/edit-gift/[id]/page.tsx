"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Gift {
  id: string;
  title: string;
  message: string;
  imageUrl: string;
  blurDataUrl?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export default function EditGiftPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const giftId = params.id as string;
  
  const [gift, setGift] = useState<Gift | null>(null);
  const [formData, setFormData] = useState({
    image: null as File | null,
    title: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGift, setIsLoadingGift] = useState(true);
  const [showImageUpload, setShowImageUpload] = useState(false);

  // Fetch the existing gift data
  useEffect(() => {
    const fetchGift = async () => {
      if (!giftId || status !== "authenticated") return;
      
      try {
        const response = await fetch(`/api/gifts/${giftId}`);
        if (response.ok) {
          const data = await response.json();
          setGift(data.gift);
          setFormData({
            image: null,
            title: data.gift.title,
            message: data.gift.message,
          });
        } else if (response.status === 404) {
          setErrors({ general: "Gift not found" });
        } else if (response.status === 403) {
          setErrors({ general: "You don't have permission to edit this gift" });
        } else {
          setErrors({ general: "Failed to load gift" });
        }
      } catch (error) {
        console.error("Error fetching gift:", error);
        setErrors({ general: "Failed to load gift" });
      } finally {
        setIsLoadingGift(false);
      }
    };

    fetchGift();
  }, [giftId, status]);

  useEffect(() => {
    console.log("Edit gift page - Session status:", status);
    console.log("Edit gift page - Session data:", session);
    
    if (status === "unauthenticated") {
      console.log("Redirecting to login page");
      router.push("/");
    }
  }, [status, router, session]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      // Clear image error when user selects a file
      if (errors.image) {
        setErrors(prev => ({
          ...prev,
          image: ""
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Image is optional for editing - only validate if a new one is selected
    if (formData.image && !formData.image.type.startsWith("image/")) {
      newErrors.image = "File must be an image";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.length > 500) {
      newErrors.message = "Message must be 500 characters or less";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Edit gift form submitted:", formData);
    
    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }

    console.log("Form validation passed, updating gift...");
    setIsLoading(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("message", formData.message);
      if (formData.image) {
        submitData.append("image", formData.image);
      }

      // Submit to API
      const response = await fetch(`/api/gifts/${giftId}`, {
        method: "PUT",
        body: submitData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Gift updated successfully:", result);
        
        alert("Gift updated successfully!");
        
        // Redirect to home page
        router.push("/home");
      } else {
        const error = await response.json();
        console.error("Error updating gift:", error);
        setErrors({ general: error.message || "Failed to update gift. Please try again." });
      }
    } catch (error) {
      console.error("Error updating gift:", error);
      setErrors({ general: "Failed to update gift. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoadingGift) {
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

  if (errors.general && !gift) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-green-800 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{errors.general}</p>
            <button
              onClick={() => router.push("/home")}
              className="bg-emerald-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-20">
      {/* Main Content */}
      <div className="relative z-20 px-6 pb-20 pt-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Edit Gift
            </h2>
            <p className="text-xl text-emerald-100">
              Update your special gift
            </p>
          </div>

          {/* Form */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {errors.general}
                </div>
              )}

              {/* Current Image Display */}
              {gift && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Current Image
                    </label>
                    {!showImageUpload && (
                      <button
                        type="button"
                        onClick={() => setShowImageUpload(true)}
                        className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Replace image"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="aspect-video relative rounded-lg overflow-hidden border border-gray-300">
                    <img
                      src={gift.imageUrl}
                      alt={gift.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* New Image Upload */}
              {showImageUpload && (
                <div>
                  <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                    New Image
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-emerald-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="image"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500"
                        >
                          <span>Upload a new file</span>
                          <input
                            id="image"
                            name="image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                  {formData.image && (
                    <div className="mt-4">
                      <div className="text-sm text-emerald-600 mb-2">
                        Selected: {formData.image.name}
                      </div>
                      <div className="aspect-video relative rounded-lg overflow-hidden border border-gray-300">
                        <img
                          src={URL.createObjectURL(formData.image)}
                          alt="Preview of selected image"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                  {errors.image && (
                    <p className="text-red-500 text-sm mt-1">{errors.image}</p>
                  )}
                  <div className="mt-3 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowImageUpload(false);
                        setFormData(prev => ({ ...prev, image: null }));
                        if (errors.image) {
                          setErrors(prev => ({ ...prev, image: "" }));
                        }
                      }}
                      className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors border border-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Gift Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-gray-900 ${
                    errors.title ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter a title for your gift"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={500}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-gray-900 resize-none ${
                    errors.message ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Write your message (up to 500 characters)"
                />
                <div className="mt-1 flex justify-between text-sm">
                  <div>
                    {errors.message && (
                      <p className="text-red-500">{errors.message}</p>
                    )}
                  </div>
                  <div className={`${formData.message.length > 450 ? 'text-red-500' : 'text-gray-500'}`}>
                    {formData.message.length}/500
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Updating Gift..." : "Update Gift"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
