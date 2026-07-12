import { cookies } from "next/headers";
import prisma from "./prisma";
import { verifyToken } from "./jwt";
import { getPermissionModuleName } from "./constants";

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

/**
 * Validates module permissions for a session user on the backend API
 */
export async function hasPermissionBackend(user: SessionUser, moduleKey: string, action: string): Promise<boolean> {
  // 1. Fetch user custom permissions override from DB
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id }
  });
  
  if (dbUser && dbUser.permissions) {
    const userPermissions = typeof dbUser.permissions === "string"
      ? (() => { try { return JSON.parse(dbUser.permissions); } catch { return null; } })()
      : (dbUser.permissions as any);
      
    if (userPermissions) {
      const permissionModule = getPermissionModuleName(moduleKey);
      if (permissionModule) {
        const matrix = userPermissions.matrix || userPermissions;
        if (matrix[permissionModule] !== undefined && matrix[permissionModule] !== null) {
          const modulePerms = matrix[permissionModule];
          if (modulePerms && modulePerms[action] !== undefined) {
            return Boolean(modulePerms[action]);
          }
        }
      }
    }
  }

  // 2. Fetch role permissions from DB
  const role = await prisma.role.findFirst({
    where: { name: user.role }
  });

  const permissionModule = getPermissionModuleName(moduleKey);
  if (role && permissionModule) {
    const permissions = role.permissions ? (
      typeof role.permissions === "string" 
        ? (() => { try { return JSON.parse(role.permissions); } catch { return null; } })()
        : (role.permissions as any)
    ) : null;
    
    if (permissions && permissions[permissionModule] !== undefined && permissions[permissionModule] !== null) {
      const modulePerms = permissions[permissionModule];
      if (modulePerms && modulePerms[action] !== undefined) {
        return Boolean(modulePerms[action]);
      }
    }
  }

  // 3. Fallback for Super Admin (general CRUD is allowed, but approve/reject/assign must be explicit)
  if (user.role === "Super Admin") {
    if (["approve", "reject", "assign"].includes(action)) {
      return false;
    }
    return true;
  }

  return false;
}

