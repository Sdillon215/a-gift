import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateBlurDataURL } from "@/lib/image-utils";

const prisma = new PrismaClient();

// GET - Fetch a specific gift
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: giftId } = await params;

    // Get the specific gift with user information
    const gift = await prisma.gift.findUnique({
      where: {
        id: giftId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!gift) {
      return NextResponse.json(
        { message: "Gift not found" },
        { status: 404 }
      );
    }

    // Check if the user owns this gift
    if (gift.userId !== session.user.id) {
      return NextResponse.json(
        { message: "Forbidden - You can only edit your own gifts" },
        { status: 403 }
      );
    }

    return NextResponse.json({ gift });
  } catch (error) {
    console.error("Error fetching gift:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update a specific gift
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: giftId } = await params;

    // Check if the gift exists and belongs to the user
    const existingGift = await prisma.gift.findUnique({
      where: {
        id: giftId,
      },
    });

    if (!existingGift) {
      return NextResponse.json(
        { message: "Gift not found" },
        { status: 404 }
      );
    }

    if (existingGift.userId !== session.user.id) {
      return NextResponse.json(
        { message: "Forbidden - You can only edit your own gifts" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const image = formData.get("image") as File | null;

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        { message: "Title and message are required" },
        { status: 400 }
      );
    }

    // Validate image file if provided
    if (image && !image.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "File must be an image" },
        { status: 400 }
      );
    }

    let imageUrl = existingGift.imageUrl;
    let blurDataUrl = existingGift.blurDataUrl;

    // Upload new image if provided
    if (image) {
      const blob = await put(image.name, image, {
        access: "public",
      });

      // Generate blur data URL for the new image
      blurDataUrl = await generateBlurDataURL(blob.url);
      imageUrl = blob.url;
    }

    // Update gift in database
    const updatedGift = await prisma.gift.update({
      where: {
        id: giftId,
      },
      data: {
        title,
        message,
        imageUrl,
        blurDataUrl,
      },
    });

    return NextResponse.json(
      { 
        message: "Gift updated successfully", 
        gift: {
          id: updatedGift.id,
          title: updatedGift.title,
          message: updatedGift.message,
          imageUrl: updatedGift.imageUrl,
          blurDataUrl: updatedGift.blurDataUrl,
          createdAt: updatedGift.createdAt,
          updatedAt: updatedGift.updatedAt,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating gift:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific gift
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: giftId } = await params;

    // Check if the gift exists and belongs to the user
    const existingGift = await prisma.gift.findUnique({
      where: {
        id: giftId,
      },
    });

    if (!existingGift) {
      return NextResponse.json(
        { message: "Gift not found" },
        { status: 404 }
      );
    }

    if (existingGift.userId !== session.user.id) {
      return NextResponse.json(
        { message: "Forbidden - You can only delete your own gifts" },
        { status: 403 }
      );
    }

    // Delete the gift
    await prisma.gift.delete({
      where: {
        id: giftId,
      },
    });

    return NextResponse.json(
      { message: "Gift deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting gift:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
