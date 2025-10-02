import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    // Save gift to database
    const gift = await prisma.gift.create({
      data: {
        title,
        message,
        imageUrl: blob.url,
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
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's gifts
    const gifts = await prisma.gift.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ gifts });
  } catch (error) {
    console.error("Error fetching gifts:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
