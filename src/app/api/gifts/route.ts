import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
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

    // Validate image file
    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "File must be an image" },
        { status: 400 }
      );
    }

    // Upload image to Vercel Blob
    const blob = await put(image.name, image, {
      access: "public",
    });

    // Generate blur data URL for the image
    const blurDataUrl = await generateBlurDataURL(blob.url);

    // Save gift to database
    const gift = await prisma.gift.create({
      data: {
        title,
        message,
        imageUrl: blob.url,
        blurDataUrl,
        userId: session.user.id,
      },
    });

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
  } catch (error) {
    console.error("Error creating gift:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Wrap everything in a try-catch to ensure we always return JSON
  try {
    console.log("[GET /api/gifts] Handler started");
    
    // Check if Prisma is properly initialized
    if (!prisma || !('gift' in prisma)) {
      console.error("[GET /api/gifts] PrismaClient not properly initialized");
      return NextResponse.json(
        { 
          message: "Database connection error: PrismaClient not initialized",
          error: "PrismaClient initialization failed"
        },
        { status: 500 }
      );
    }
    console.log("[GET /api/gifts] PrismaClient is initialized");

    // Check if user is authenticated
    let session;
    try {
      console.log("[GET /api/gifts] Getting session...");
      session = await getServerSession(authOptions);
      console.log("[GET /api/gifts] Session retrieved:", session ? "exists" : "null");
    } catch (sessionError) {
      console.error("Error getting session:", sessionError);
      const sessionErrorMessage = sessionError instanceof Error ? sessionError.message : "Unknown session error";
      const sessionErrorStack = sessionError instanceof Error ? sessionError.stack : undefined;
      console.error("Session error stack:", sessionErrorStack);
      // Include error details in response for debugging
      return NextResponse.json(
        { 
          message: `Session error: ${sessionErrorMessage}`,
          error: sessionErrorMessage,
          stack: sessionErrorStack
        },
        { status: 500 }
      );
    }

    if (!session?.user?.id) {
      console.log("[GET /api/gifts] No session or user ID");
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    console.log("[GET /api/gifts] User authenticated:", session.user.id);

    // Get all gifts with user information
    let gifts;
    try {
      console.log("[GET /api/gifts] Querying database...");
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
      console.log("[GET /api/gifts] Database query successful, found", gifts.length, "gifts");
    } catch (dbError) {
      console.error("[GET /api/gifts] Database error fetching gifts:", dbError);
      const dbErrorMessage = dbError instanceof Error ? dbError.message : "Unknown database error";
      const dbErrorStack = dbError instanceof Error ? dbError.stack : undefined;
      console.error("Database error stack:", dbErrorStack);
      // Include error details in response for debugging
      return NextResponse.json(
        { 
          message: `Database error: ${dbErrorMessage}`,
          error: dbErrorMessage,
          stack: dbErrorStack
        },
        { status: 500 }
      );
    }

    console.log("[GET /api/gifts] Returning response with", gifts.length, "gifts");
    return NextResponse.json({ gifts });
  } catch (error) {
    console.error("[GET /api/gifts] Top-level error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error stack:", errorStack);
    
    // Try to return JSON, but if that fails, return a simple text response
    try {
      return NextResponse.json(
        { 
          message: `Internal server error: ${errorMessage}`,
          error: errorMessage,
          stack: errorStack
        },
        { status: 500 }
      );
    } catch (jsonError) {
      // If JSON serialization fails, return a plain text response
      console.error("Failed to serialize error response:", jsonError);
      return new NextResponse(
        `Internal server error: ${errorMessage}`,
        { 
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
        }
      );
    }
  }
}
