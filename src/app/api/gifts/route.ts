import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { put, del } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateBlurDataURL } from "@/lib/image-utils";

// Initialize Prisma with error handling
let prisma: PrismaClient;
try {
  prisma = new PrismaClient();
} catch (prismaError) {
  console.error("Failed to initialize PrismaClient:", prismaError);
  // Create a dummy client that will throw on use (so we can catch it)
  prisma = {} as PrismaClient;
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const image = formData.get("image") as File;

    // Validate required fields
    if (!title || !message || !image) {
      return NextResponse.json(
        { message: "Title, message, and image are required" },
        { status: 400 }
      );
    }

    // Validate image file type
    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "File must be an image. Please upload a PNG, JPG, or GIF file." },
        { status: 400 }
      );
    }

    // Validate image file size (4.5MB limit - Vercel serverless function limit)
    const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB in bytes (Vercel's limit)
    if (image.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: `Image is too large. Maximum file size is 4.5MB. Your file is ${(image.size / 1024 / 1024).toFixed(2)}MB.` },
        { status: 400 }
      );
    }

    // Validate specific image formats
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(image.type.toLowerCase())) {
      return NextResponse.json(
        { message: `Unsupported image format. Please use PNG, JPG, GIF, or WebP.` },
        { status: 400 }
      );
    }

    // Upload image to Vercel Blob
    let blob;
    try {
      blob = await put(image.name, image, {
        access: "public",
      });
    } catch (blobError: unknown) {
      console.error("Error uploading to blob storage:", blobError);
      return NextResponse.json(
        { message: "Failed to upload image. Please try again or use a smaller file." },
        { status: 500 }
      );
    }

    // Generate blur data URL for the image
    let blurDataUrl;
    try {
      blurDataUrl = await generateBlurDataURL(blob.url);
    } catch (blurError) {
      console.error("Error generating blur data URL:", blurError);
      // Continue without blur data URL - it's not critical
      blurDataUrl = null;
    }

    // Save gift to database
    let gift;
    try {
      gift = await prisma.gift.create({
        data: {
          title,
          message,
          imageUrl: blob.url,
          blurDataUrl,
          userId: session.user.id,
        },
      });
    } catch (dbError: unknown) {
      console.error("Error saving gift to database:", dbError);
      // Try to clean up the uploaded blob if database save fails
      try {
        await del(blob.url);
      } catch (cleanupError) {
        console.error("Error cleaning up blob:", cleanupError);
      }
      return NextResponse.json(
        { message: "Failed to save gift. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: "Gift created successfully", 
        gift: {
          id: gift.id,
          title: gift.title,
          message: gift.message,
          imageUrl: gift.imageUrl,
          blurDataUrl: gift.blurDataUrl,
          createdAt: gift.createdAt,
        }
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating gift:", error);
    
    // Provide more specific error messages based on error type
    let errorMessage = "An unexpected error occurred. Please try again.";
    
    if (error instanceof Error) {
      if (error.message) {
        errorMessage = error.message;
      } else if (error.name === "PrismaClientKnownRequestError") {
        errorMessage = "Database error. Please try again.";
      } else if (error.name === "NetworkError" || (error as { code?: string }).code === "ECONNREFUSED") {
        errorMessage = "Network error. Please check your connection and try again.";
      }
    }
    
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Check if Prisma is properly initialized
    if (!prisma || !('gift' in prisma)) {
      console.error("PrismaClient not properly initialized");
      return NextResponse.json(
        { message: "Database connection error" },
        { status: 500 }
      );
    }

    // Check if user is authenticated
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch (sessionError) {
      console.error("Error getting session:", sessionError);
      return NextResponse.json(
        { message: "Authentication error" },
        { status: 500 }
      );
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all gifts with user information
    let gifts;
    try {
      gifts = await prisma.gift.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (dbError) {
      console.error("Database error fetching gifts:", dbError);
      return NextResponse.json(
        { message: "Database error" },
        { status: 500 }
      );
    }

    // Check if user is admin
    const isAdmin = (session.user as { isAdmin?: boolean })?.isAdmin || false;
    const currentUserId = session.user.id;

    // Conditionally include messages based on user role and ownership
    const giftsWithFilteredMessages = gifts.map(gift => {
      const giftData: {
        id: string;
        title: string;
        message: string | null;
        imageUrl: string;
        blurDataUrl: string | null;
        createdAt: Date;
        user: {
          id: string;
          name: string | null;
          email: string;
        };
      } = {
        id: gift.id,
        title: gift.title,
        message: null, // Default to null
        imageUrl: gift.imageUrl,
        blurDataUrl: gift.blurDataUrl,
        createdAt: gift.createdAt,
        user: gift.user,
      };

      // Show message if: user is admin OR gift belongs to current user
      if (isAdmin || gift.userId === currentUserId) {
        giftData.message = gift.message;
      }

      return giftData;
    });

    return NextResponse.json({ gifts: giftsWithFilteredMessages });
  } catch (error) {
    console.error("Error fetching gifts:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
