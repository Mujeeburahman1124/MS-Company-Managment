"use client";

import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, FileCheck } from "lucide-react";
import { useMemo } from "react";

export default function PayrollDashboard() {
  const { currentRole, currentUser, payroll, staff } = useAuthStore();

  const allowedStaff = currentRole === "Super Admin" ? staff : staff.filter(s => s.company === currentUser.company);
  let visiblePayroll = currentRole === "Super Admin" ? payroll : payroll.filter(p => p.company === currentUser.company);

  const stats = useMemo(() => {
    const currentMonth = new Date().toLocaleString('default', { month: 'short' });
    const currentYear = new Date().getFullYear();

    const thisMonth = visiblePayroll.filter(p => p.month === currentMonth && p.year === currentYear);
    const totalNet = thisMonth.reduce((sum, p) => sum + p.netSalary, 0);
    const approvedCount = thisMonth.filter(p => p.status === "Approved" || p.status === "Paid").length;
    
    return {
      totalNet,
      totalStaff: allowedStaff.length,
      processedStaff: thisMonth.length,
      approvedCount
    };
  }, [visiblePayroll, allowedStaff]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 rounded-2xl border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">This Month's Payroll</div>
            <div className="text-xl font-black text-slate-800">AED {stats.totalNet.toLocaleString()}</div>
          </div>
        </Card>
        <Card className="p-5 rounded-2xl border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Processed Staff</div>
            <div className="text-xl font-black text-slate-800">{stats.processedStaff} / {stats.totalStaff}</div>
          </div>
        </Card>
        <Card className="p-5 rounded-2xl border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Salary</div>
            <div className="text-xl font-black text-slate-800">AED {stats.processedStaff > 0 ? Math.round(stats.totalNet / stats.processedStaff).toLocaleString() : 0}</div>
          </div>
        </Card>
        <Card className="p-5 rounded-2xl border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved</div>
            <div className="text-xl font-black text-slate-800">{stats.approvedCount} / {stats.processedStaff}</div>
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl border-slate-100 bg-white shadow-sm p-6 flex flex-col items-center justify-center text-center h-64">
        <DollarSign className="w-10 h-10 text-slate-200 mb-2" />
        <p className="text-sm font-semibold text-slate-500">More detailed payroll charts will appear here as you accumulate data.</p>
      </Card>
    </div>
  );
}
