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
