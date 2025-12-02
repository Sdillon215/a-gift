"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function SendAGiftPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    image: null as File | null,
    title: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

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

    if (!formData.image) {
      newErrors.image = "Please select an image";
    } else {
      // Validate image file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(formData.image.type.toLowerCase())) {
        newErrors.image = "Unsupported file type. Please use PNG, JPG, GIF, or WebP.";
      }
      
      // Validate image file size (10MB limit)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
      if (formData.image.size > MAX_FILE_SIZE) {
        const fileSizeMB = (formData.image.size / 1024 / 1024).toFixed(2);
        newErrors.image = `Image is too large (${fileSizeMB}MB). Maximum file size is 10MB.`;
      }
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

    if (!validateForm()) {
      return;
    }

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
      const response = await fetch("/api/gifts", {
        method: "POST",
        body: submitData,
      });

      if (response.ok) {
        await response.json();

        setShowSuccessAlert(true);

        // Reset form
        setFormData({
          image: null,
          title: "",
          message: "",
        });

        // Set flag to refresh gifts when redirected to home page
        sessionStorage.setItem("giftCreated", "true");

        // Invalidate gifts cache so the home page shows the new gift
        import("@/hooks/useGifts").then(({ invalidateGiftsCache }) => {
          invalidateGiftsCache();
        });

        // Redirect to home page after showing success message
        // Give enough time for the database to be updated
        setTimeout(() => {
          // Invalidate cache again right before redirect to ensure fresh data
          import("@/hooks/useGifts").then(({ invalidateGiftsCache }) => {
            invalidateGiftsCache();
          });
          router.push("/home");
        }, 2000);
      } else {
        // Try to parse error response
        let errorMessage = "Failed to send gift. Please try again.";
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          // If response is not JSON, use status-based messages
          if (response.status === 400) {
            errorMessage = "Invalid request. Please check your input and try again.";
          } else if (response.status === 401) {
            errorMessage = "You are not authorized. Please log in and try again.";
          } else if (response.status === 413) {
            errorMessage = "File is too large. Please use an image smaller than 10MB.";
          } else if (response.status >= 500) {
            errorMessage = "Server error. Please try again later.";
          }
        }
        console.error("Error creating gift:", response.status, errorMessage);
        setErrors({ general: errorMessage });
      }
    } catch (error: unknown) {
      console.error("Error sending gift:", error);
      let errorMessage = "Failed to send gift. Please try again.";
      
      // Handle network errors
      if (error instanceof Error) {
        if (error.name === "TypeError" && error.message.includes("fetch")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="min-h-screen relative z-20">
      {/* Success Alert */}
      {showSuccessAlert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-emerald-500 text-white px-6 py-4 rounded-lg shadow-lg border border-emerald-400 flex items-center space-x-3 animate-in slide-in-from-top-2 duration-300">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Gift sent successfully!</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-20 px-6 pb-20 pt-6">
        <div className="max-w-2xl mx-auto">
          {/* Ashley Image */}
          <div className="mb-8">
            <div className="relative w-full aspect-video overflow-hidden rounded-2xl shadow-2xl border-2 border-white/30 hover:border-white/50 transition-all duration-300">
              <Image
                src="/images/ashley-sean.jpg"
                alt="Ashley"
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
                priority
              />
            </div>
          </div>
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Let&apos;s make Ashley&apos;s birthday special!
            </h2>
            <p className="text-xl text-emerald-100 mb-4">
              Hi! I&apos;m Sean and I&apos;m lucky enough to be Ashley&apos;s partner. If you&apos;ve made it here, you&apos;ve also been lucky enough to be a part of her life, and I would love your help to make her birthday special!
            </p>
            <p className="text-xl text-emerald-100 mb-4">
              Ashley loves handmade personal gifts. Unfortunately, I am not very skilled at crafting. However, I am decent at coding, so I have decided to use this creative skill set to put together a gift that I hope turns into something truly meaningful to Ashley.
            </p>
            <p className="text-xl text-emerald-100 mb-4">
              The gift I would like to give her is simple. A reminder and a validation of the incredibly positive impact she has on the world!
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How You Can Help</h2>

            <div className="space-y-4 text-left">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <p className="text-lg text-emerald-100">
                  <span className="font-semibold text-white">Upload a photo</span> - Share a picture of you and Ashley together, or a special memory you have with her.
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <p className="text-lg text-emerald-100">
                  <span className="font-semibold text-white">Write a message</span> - Tell Ashley how she&apos;s impacted your life or share a meaningful memory you&apos;ve had with her.
                </p>
              </div>

               <div className="flex items-start space-x-3">
                 <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                   3
                 </div>
                 <p className="text-lg text-emerald-100">
                   <span className="font-semibold text-white">Submit your gift card</span> - Click &quot;Send Gift&quot; and your contribution will be added to the home feed to be presented to Ashley on her birthday!
                 </p>
               </div>
             </div>

             <div className="mt-6 p-4 bg-amber-500/20 border border-amber-400/30 rounded-lg">
               <div className="flex items-start space-x-3">
                 <div className="flex-shrink-0">
                   <svg className="w-5 h-5 text-amber-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                     <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                   </svg>
                 </div>
                 <div>
                   <div className="flex items-center justify-between mb-1">
                     <p className="text-sm text-amber-100 font-medium mx-auto text-center">Privacy Notice</p>
                     <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                     </svg>
                   </div>
                  <p className="text-xs text-amber-200">
                    Although the gift cards are visible to everyone on the home feed, these cards are meant to be personal. Images, captions, and names will be visible to all, but any message you share will only be visible to Ashley.
                   </p>
                 </div>
               </div>
             </div>

             <div className="mt-4 p-4 bg-red-500/20 border border-red-400/30 rounded-lg">
               <div className="flex items-center justify-between mb-1">
                 <span className="text-2xl">🎂</span>
                 <p className="text-sm text-red-100 font-medium">SURPRISE!</p>
                 <span className="text-2xl">🎂</span>
               </div>
               <p className="text-xs text-red-200">
                 This is a surprise for Ashley! Let&apos;s keep it a secret until her birthday! 🤫
               </p>
             </div>

          </div>

          {/* Form */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {errors.general}
                </div>
              )}

              {/* Image Upload */}
              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                  Gift Card Image *
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
                    <div className="flex flex-col items-center gap-3">
                      <label
                        htmlFor="image"
                        className="relative cursor-pointer bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500 transition-colors shadow-md hover:shadow-lg"
                      >
                        <span>Upload a file</span>
                        <input
                          id="image"
                          name="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="sr-only"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF, or WebP up to 10MB</p>
                  </div>
                </div>
                {formData.image && (
                  <div className="mt-2 text-sm text-emerald-600">
                    Selected: {formData.image.name}
                  </div>
                )}
                {errors.image && (
                  <p className="text-red-500 text-sm mt-1">{errors.image}</p>
                )}
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Image Caption *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-none transition-colors text-gray-900 ${errors.title ? "border-red-500" : "border-gray-300"
                    }`}
                  placeholder="Add a caption to your image"
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-none transition-colors text-gray-900 resize-none ${errors.message ? "border-red-500" : "border-gray-300"
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
                {isLoading ? "Sending Gift..." : "Send Gift"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
