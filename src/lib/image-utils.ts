// Lazy import to avoid loading sharp at module initialization
// This prevents errors when sharp is not available (e.g., on Vercel Linux)

export interface ImageWithBlur {
  src: string;
  blurDataURL: string;
}

/**
 * Generates a blur data URL for an image using plaiceholder
 * @param imageUrl - The URL of the image
 * @returns Promise with blur data URL or null if generation fails
 */
export async function generateBlurDataURL(imageUrl: string): Promise<string | null> {
  try {
    // Lazy import to avoid module load errors if sharp is not available
    const { getPlaiceholder } = await import("plaiceholder");
    const { base64 } = await getPlaiceholder(imageUrl);
    return base64;
  } catch (error) {
    console.warn("Failed to generate blur data URL for:", imageUrl, error);
    return null;
  }
}

/**
 * Creates an optimized image object with blur data URL
 * @param imageUrl - The URL of the image
 * @returns Promise with image object containing src and blurDataURL
 */
export async function createOptimizedImage(imageUrl: string): Promise<ImageWithBlur> {
  const blurDataURL = await generateBlurDataURL(imageUrl);
  
  return {
    src: imageUrl,
    blurDataURL: blurDataURL || "",
  };
}
