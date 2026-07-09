import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const { title, content, isActive } = data;
    const term = await prisma.placementTerm.update({
      where: { id: params.id },
      data: { title, content, isActive }
    });
    return NextResponse.json(term);
  } catch (error) {
    console.error("Error updating term:", error);
    return NextResponse.json({ error: "Failed to update term" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.placementTerm.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting term:", error);
    return NextResponse.json({ error: "Failed to delete term" }, { status: 500 });
  }
}
