"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import Breadcrumb from "./Breadcrumb";
import BottomNav from "./BottomNav";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import ReminderEngine from "@/components/shared/ReminderEngine";
import { useAuthStore } from "@/store/authStore";
import AccessDenied from "@/components/shared/AccessDenied";
import { getPermissionModuleName } from "@/lib/constants";

/** Pages that do NOT require authentication */
const PUBLIC_PATHS = ["/login", "/forgot-password", "/tracking", "/apply"];

/** Navigation item permission rules corresponding to Sidebar options */
const NAV_ITEM_PERMISSIONS = [
  { href: '/applicants',   permissionKey: 'applicants' },
  { href: '/interviews',   permissionKey: 'interviews' },
  { href: '/placement',    permissionKey: 'placement' },
  { href: '/tracking',     permissionKey: 'tracking' },
  { href: '/members',      permissionKey: 'members' },
  { href: '/staff',        permissionKey: 'staff' },
  { href: '/birthday',     permissionKey: 'birthday' },
  { href: '/leave',        permissionKey: 'leave' },
  { href: '/requests',     permissionKey: 'requests' },
  { href: '/attendance',   permissionKey: 'attendance' },
  { href: '/payroll',      permissionKey: 'payroll' },
  { href: '/companies',    permissionKey: 'companies' },
  { href: '/branches',     permissionKey: 'branches' },
  { href: '/suppliers',    permissionKey: 'suppliers' },
  { href: '/vehicles',     permissionKey: 'vehicles' },
  { href: '/tasks',        permissionKey: 'tasks' },
  { href: '/documents',    permissionKey: 'documents' },
  { href: '/visa-expiry',  permissionKey: 'visaExpiry' },
  { href: '/users',        permissionKey: 'users',        hiddenFor: ['Staff', 'Recruiter', 'Accountant'] },
  { href: '/roles',        permissionKey: 'roles',        hiddenFor: ['Staff', 'HR Manager', 'Recruiter', 'Accountant', 'Branch Admin'] },
  { href: '/own-companies', superAdminOnly: true },
  { href: '/reports',      permissionKey: 'reports',      hiddenFor: ['Staff'] },
  { href: '/activity-log', permissionKey: 'activityLog',  hiddenFor: ['Staff', 'Recruiter'] },
  { href: '/settings',     permissionKey: 'settings',     hiddenFor: ['Staff', 'HR Manager', 'Recruiter', 'Accountant', 'Branch Admin'] },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, checkSession, currentRole, currentUser, hasPermission } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  const isPublicPage = PUBLIC_PATHS.some(p => pathname === p || pathname?.startsWith(p + "/"));

  // Check backend session on mount
  useEffect(() => {
    async function verifySession() {
      try {
        await checkSession();
      } catch (err) {
        console.error("AppShell session check failed:", err);
      } finally {
        setIsChecking(false);
      }
    }
    verifySession();
  }, [checkSession]);

  // Login guard: if not authenticated and not on a public page, redirect to /login
  useEffect(() => {
    if (!isChecking && !isPublicPage && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isChecking, isPublicPage, isAuthenticated, router]);

  const isLoginPage = pathname === "/login";
  const isTrackingPage = pathname?.startsWith("/tracking");
  const isForgotPasswordPage = pathname === "/forgot-password";
  const isApplyPage = pathname === "/apply";
  const isFullWidthPage = isLoginPage || isTrackingPage || isForgotPasswordPage || isApplyPage;

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Loading session...</p>
        </div>
      </div>
    );
  }

  if (isFullWidthPage) {
    return (
      <div className={cn("font-sans", "min-h-screen bg-slate-50 flex flex-col w-full")}>
        <main className="flex-1 flex flex-col">{children}</main>
        <Toaster position="top-right" closeButton richColors />
        <ReminderEngine />
      </div>
    );
  }

  // Don't render the full shell until authenticated (prevents flash)
  if (!isAuthenticated) {
    return null;
  }

  // Check dynamic route level permission gate
  const isSuperAdmin = currentRole === "Super Admin";
  let pageContent = children;

  const matchingItem = NAV_ITEM_PERMISSIONS.find(item => 
    pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href + "/"))
  );

  if (matchingItem) {
    let allowed = true;
    if (matchingItem.superAdminOnly && !isSuperAdmin) {
      allowed = false;
    } else if (matchingItem.hiddenFor && matchingItem.hiddenFor.includes(currentRole)) {
      allowed = false;
    } else if (matchingItem.permissionKey) {
      if (!isSuperAdmin) {
        // Check custom overrides first
        let hasCustomOverride = false;
        let customOverrideVal = false;
        if (currentUser?.permissions) {
          const userPermissions = typeof currentUser.permissions === 'string'
            ? (() => { try { return JSON.parse(currentUser.permissions); } catch { return null; } })()
            : currentUser.permissions;
          if (userPermissions) {
            const permissionModule = getPermissionModuleName(matchingItem.permissionKey);
            if (permissionModule) {
              const matrix = userPermissions.matrix || userPermissions;
              if (matrix[permissionModule] !== undefined && matrix[permissionModule] !== null) {
                const modulePerms = matrix[permissionModule];
                if (modulePerms && modulePerms["view"] !== undefined) {
                  hasCustomOverride = true;
                  customOverrideVal = Boolean(modulePerms["view"]);
                }
              }
            }
          }
        }
        
        if (hasCustomOverride) {
          allowed = customOverrideVal;
        } else {
          allowed = hasPermission(matchingItem.permissionKey, "view");
        }
      }
    }

    if (!allowed) {
      pageContent = <AccessDenied />;
    }
  }

  return (
    <div className={cn("font-sans", "min-h-screen bg-slate-50 flex text-slate-800 antialiased overflow-hidden w-full")}>
      {/* Sidebar - Desktop / Tablet */}
      <Sidebar />

      {/* Main Panel Wrapper */}
      <div className="flex-1 flex flex-col md:pl-[70px] lg:pl-[260px] h-screen overflow-hidden relative transition-all duration-300">
        {/* Top Header */}
        <Header />

        {/* Dynamic Breadcrumbs */}
        <Breadcrumb />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 bg-slate-50">
          {pageContent}
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>
      <Toaster position="top-right" closeButton richColors />
      <ReminderEngine />
    </div>
  );
}
