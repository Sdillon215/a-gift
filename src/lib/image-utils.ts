import { getPlaiceholder } from "plaiceholder";

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
