"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/shared/PageHeader";
import PayrollDashboard from "./components/PayrollDashboard";
import SalarySetup from "./components/SalarySetup";
import ProcessPayroll from "./components/ProcessPayroll";
import Payslips from "./components/Payslips";
import PayrollReports from "./components/PayrollReports";
import PayrollHistory from "./components/PayrollHistory";
import { useAuthStore } from "@/store/authStore";

const ALL_TABS = [
  "Dashboard",
  "Salary Setup",
  "Process Payroll",
  "Payslips",
  "Reports",
  "History"
];

export default function PayrollPage() {
  const { currentUser } = useAuthStore();
  const isStaff = currentUser?.role === "Staff";
  const availableTabs = isStaff ? ["Payslips"] : ALL_TABS;
  
  const [activeTab, setActiveTab] = useState(isStaff ? "Payslips" : "Dashboard");

  useEffect(() => {
    if (isStaff && activeTab !== "Payslips") {
      setActiveTab("Payslips");
    }
  }, [isStaff, activeTab]);

  return (
    <div className="flex flex-col h-full pb-12">
      <PageHeader
        title="Payroll Management"
        subtitle="Manage salaries, deductions, and issue payslips"
      />

      <div className="px-4 md:px-6 pt-2 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600 bg-blue-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 w-full max-w-7xl mx-auto space-y-6">
        {activeTab === "Dashboard" && !isStaff && <PayrollDashboard />}
        {activeTab === "Salary Setup" && !isStaff && <SalarySetup />}
        {activeTab === "Process Payroll" && !isStaff && <ProcessPayroll />}
        {activeTab === "Payslips" && <Payslips />}
        {activeTab === "Reports" && !isStaff && <PayrollReports />}
        {activeTab === "History" && !isStaff && <PayrollHistory />}
      </div>
    </div>
  );
}
