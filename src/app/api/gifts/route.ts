import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateBlurDataURL } from "@/lib/image-utils";
import { prisma } from "@/lib/db";

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
    let blob;
    try {
      blob = await put(image.name, image, {
        access: "public",
      });
    } catch (blobError) {
      console.error("Error uploading to Vercel Blob:", blobError);
      return NextResponse.json(
        { message: "Failed to upload image. Please check your BLOB_READ_WRITE_TOKEN environment variable." },
        { status: 500 }
      );
    }

    // Generate blur data URL for the image (non-blocking, can fail gracefully)
    let blurDataUrl: string | null = null;
    try {
      blurDataUrl = await generateBlurDataURL(blob.url);
    } catch (blurError) {
      console.warn("Failed to generate blur data URL:", blurError);
      // Continue without blur data URL
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
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { message: "Failed to save gift to database. Please try again." },
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
  } catch (error) {
    console.error("Error creating gift:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all gifts with user information
    const gifts = await prisma.gift.findMany({
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

    return NextResponse.json({ gifts });
  } catch (error) {
    console.error("Error fetching gifts:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
