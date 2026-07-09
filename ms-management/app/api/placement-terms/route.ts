import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const terms = await prisma.placementTerm.findMany({
      orderBy: { order: 'asc' }
    });
    return NextResponse.json(terms);
  } catch (error) {
    console.error("Error fetching terms:", error);
    return NextResponse.json({ error: "Failed to fetch terms" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { title, content, order, isActive } = data;
    const term = await prisma.placementTerm.create({
      data: { title, content, order, isActive: isActive ?? true }
    });
    return NextResponse.json(term);
  } catch (error) {
    console.error("Error creating term:", error);
    return NextResponse.json({ error: "Failed to create term" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    // Assuming data is an array of terms for bulk reordering
    if (Array.isArray(data)) {
      const updates = data.map(term => prisma.placementTerm.update({
        where: { id: term.id },
        data: { order: term.order }
      }));
      await prisma.$transaction(updates);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  } catch (error) {
    console.error("Error updating term order:", error);
    return NextResponse.json({ error: "Failed to update terms" }, { status: 500 });
  }
}
