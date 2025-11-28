import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateBlurDataURL } from "@/lib/image-utils";

const prisma = new PrismaClient();

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

export async function GET() {
  try {
    // Check if user is authenticated
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch (sessionError) {
      console.error("Error getting session:", sessionError);
      const sessionErrorMessage = sessionError instanceof Error ? sessionError.message : "Unknown session error";
      return NextResponse.json(
        { message: `Session error: ${sessionErrorMessage}` },
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
      const dbErrorMessage = dbError instanceof Error ? dbError.message : "Unknown database error";
      const dbErrorStack = dbError instanceof Error ? dbError.stack : undefined;
      console.error("Database error stack:", dbErrorStack);
      return NextResponse.json(
        { message: `Database error: ${dbErrorMessage}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ gifts });
  } catch (error) {
    console.error("Error fetching gifts:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error stack:", errorStack);
    return NextResponse.json(
      { message: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
