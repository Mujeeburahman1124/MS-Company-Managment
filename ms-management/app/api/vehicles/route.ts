import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, getTenantScopeFilter } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filter = getTenantScopeFilter(user, "company", "branch");

    const vehicles = await prisma.vehicle.findMany({
      where: filter,
      orderBy: { plateNumber: "asc" }
    });

    return NextResponse.json(vehicles);
  } catch (error: any) {
    console.error("GET vehicles error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    const plateNumber = data.plateNumber;
    const vehicleType = data.vehicleType || data.model;
    const brand = data.brand || data.make;
    const company = data.company;
    const branch = data.branch;

    if (!plateNumber || !vehicleType || !brand || !company || !branch) {
      return NextResponse.json(
        { error: "Plate number, type/model, brand/make, company, and branch are required" },
        { status: 400 }
      );
    }

    // Tenancy Check
    if (user.role !== "Super Admin" && company !== user.company) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        id: data.id || undefined,
        plateNumber,
        model: vehicleType,
        make: brand,
        year: Number(data.year) || new Date().getFullYear(),
        status: data.status || "Available",
        assignedTo: data.assignedTo || null,
        assignedToId: data.assignedToId || null,
        company,
        branch,
        createdAt: data.createdAt || new Date().toISOString().replace("T", " ").slice(0, 19),
        vehicleType,
        brand,
        plateCode: data.plateCode || "Dubai",
        registrationCountry: data.registrationCountry || "UAE",
        emirate: data.emirate || "Dubai",
        colour: data.colour || "White",
        km: Number(data.km) || 0,
        picture: data.picture || null,
        insuranceExpiry: data.insuranceExpiry || "",
        registrationExpiry: data.registrationExpiry || "",
        licenseExpiry: data.licenseExpiry || "",
        notes: data.notes || "",
        createdBy: data.createdBy || user.name,
        assignmentHistory: data.assignmentHistory || null
      }
    });

    return NextResponse.json(vehicle);
  } catch (error: any) {
    console.error("POST vehicle error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
