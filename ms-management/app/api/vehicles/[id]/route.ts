import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, hasPermissionBackend } from "@/lib/auth-helpers";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    const existing = await prisma.vehicle.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Tenancy Check
    if (user.role !== "Super Admin" && existing.company !== user.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Permission Check
    const isAssignmentChange = data.status === "Assigned" || data.status === "Returned" || data.assignedTo !== undefined;
    if (isAssignmentChange) {
      if (!(await hasPermissionBackend(user, "vehicles", "assign"))) {
        return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
      }
    } else {
      if (!(await hasPermissionBackend(user, "vehicles", "edit"))) {
        return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
      }
    }

    const updated = await prisma.vehicle.update({
      where: { id },
      data: {
        plateNumber: data.plateNumber ?? undefined,
        model: data.vehicleType ?? data.model ?? undefined,
        make: data.brand ?? data.make ?? undefined,
        year: data.year !== undefined ? Number(data.year) : undefined,
        status: data.status ?? undefined,
        assignedTo: data.assignedTo !== undefined ? data.assignedTo : undefined,
        assignedToId: data.assignedToId !== undefined ? data.assignedToId : undefined,
        company: data.company ?? undefined,
        branch: data.branch ?? undefined,
        vehicleType: data.vehicleType ?? undefined,
        brand: data.brand ?? undefined,
        plateCode: data.plateCode ?? undefined,
        registrationCountry: data.registrationCountry ?? undefined,
        emirate: data.emirate ?? undefined,
        colour: data.colour ?? undefined,
        km: data.km !== undefined ? (data.km === "" ? 0 : Number(data.km)) : undefined,
        picture: data.picture !== undefined ? data.picture : undefined,
        insuranceExpiry: data.insuranceExpiry ?? undefined,
        registrationExpiry: data.registrationExpiry ?? undefined,
        licenseExpiry: data.licenseExpiry ?? undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
        assignmentHistory: data.assignmentHistory ?? undefined,
        documents: data.documents ?? undefined
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT vehicle error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.vehicle.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Tenancy Check
    if (user.role !== "Super Admin" && existing.company !== user.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!(await hasPermissionBackend(user, "vehicles", "delete"))) {
      return NextResponse.json({ error: "Forbidden: Access Denied" }, { status: 403 });
    }

    await prisma.vehicle.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Vehicle deleted" });
  } catch (error: any) {
    console.error("DELETE vehicle error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
