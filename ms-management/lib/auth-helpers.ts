import { cookies } from "next/headers";
import prisma from "./prisma";
import { verifyToken } from "./jwt";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  branch: string;
  status: string;
  mobile: string;
  whatsapp: string;
}

/**
 * Gets the current authenticated session user from cookie
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("auth_token");

    if (!tokenCookie || !tokenCookie.value) {
      return null;
    }

    const payload = await verifyToken(tokenCookie.value);

    if (!payload || !payload.id) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id as string }
    });

    if (!user || user.status !== "Active") {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      branch: user.branch,
      status: user.status,
      mobile: user.mobile,
      whatsapp: user.whatsapp
    };
  } catch (error) {
    console.error("getSessionUser error:", error);
    return null;
  }
}

/**
 * Checks if the user is authorized for specific roles
 */
export function hasRole(user: SessionUser, roles: string[]): boolean {
  return roles.includes(user.role);
}

/**
 * Scopes database queries based on user multi-tenant permissions.
 * - Super Admin can view all data (no scoping).
 * - Company Admin/HR/Accountant can view only their company's data.
 * - Branch Admin/Staff can view only their branch's data.
 * 
 * Returns a prisma WHERE filter object.
 */
export function getTenantScopeFilter(user: SessionUser, companyField = "company", branchField = "branch") {
  if (user.role === "Super Admin") {
    return {};
  }
  
  const filter: Record<string, any> = {};
  
  if (user.company && user.company !== "System") {
    filter[companyField] = user.company;
  }
  
  if (user.role !== "Company Admin") {
    // Branch Admin, HR, Staff MUST be restricted to their branch
    filter[branchField] = (user.branch && user.branch !== "All") ? user.branch : "RESTRICTED_ACCESS";
  }
  
  return filter;
}
