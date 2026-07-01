"use strict";
"use client";

import { useAuthStore } from "@/store/authStore";

interface PermissionGateProps {
  module: string;
  action: "view" | "create" | "edit" | "delete" | "download" | "upload" | "export" | "print" | "approve" | "reject" | "assign" | "statusChange" | "restore";
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function PermissionGate({ module, action, children, fallback = null }: PermissionGateProps) {
  const { hasPermission } = useAuthStore();
  
  if (!hasPermission(module, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
