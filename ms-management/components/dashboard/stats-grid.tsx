"use client";

import { useAuthStore } from "@/store/authStore";
import StatCard from "@/components/shared/StatCard";
import { Users, UserCheck, CheckSquare, AlertTriangle } from "lucide-react";

export function MSStatsGrid() {
  const { applicants, staff, tasks, currentUser, currentRole } = useAuthStore();

  const isSuperAdmin = currentRole === "Super Admin";
  const userCompany = currentUser.company;

  const filteredApplicants = isSuperAdmin 
    ? applicants 
    : applicants.filter((a) => a.company === userCompany);
    
  const filteredStaff = isSuperAdmin 
    ? staff 
    : staff.filter((s) => s.company === userCompany);

  const filteredTasks = isSuperAdmin 
    ? tasks 
    : tasks.filter((t) => t.company === userCompany);

  const pendingTasks = filteredTasks.filter((t) => t.status === "Pending" || t.status === "Processing" || t.status === "Reassigned" || t.status === "Incomplete");
  const urgentTasksCount = pendingTasks.filter((t) => t.priority === "High").length;

  const criticalVisaAlerts = [...filteredApplicants, ...filteredStaff].filter((person) => {
    if (!person.visaExpiry) return false;
    const expiry = new Date(person.visaExpiry);
    const today = new Date("2026-06-04");
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 20;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ms-stagger">
      <StatCard
        title="Total Applicants"
        value={filteredApplicants.length}
        icon={Users}
        description="Registered profiles"
        trend={{ value: "12%", type: "up" }}
        color="blue"
      />
      <StatCard
        title="Active Staff"
        value={filteredStaff.length}
        icon={UserCheck}
        description="Onboarded employees"
        trend={{ value: "3%", type: "up" }}
        color="emerald"
      />
      <StatCard
        title="Pending Tasks"
        value={pendingTasks.length}
        icon={CheckSquare}
        description={`${urgentTasksCount} High Priority`}
        trend={{ value: urgentTasksCount, type: "neutral" }}
        color="amber"
      />
      <StatCard
        title="Visa Expiry Warnings"
        value={criticalVisaAlerts.length}
        icon={AlertTriangle}
        description="Due in 20 days or less"
        color="rose"
      />
    </div>
  );
}
