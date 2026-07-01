"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, Save, Search } from "lucide-react";
import { toast } from "sonner";
import EmptyState from "@/components/shared/EmptyState";

export default function SalarySetup() {
  const { currentRole, currentUser, staff, salarySetups, updateSalarySetup } = useAuthStore();
  const [search, setSearch] = useState("");
  
  // Local state to keep track of typed inputs before committing to store
  const [localSetups, setLocalSetups] = useState<Record<string, { basic: string; housing: string; transport: string }>>({});

  let allowedStaff = currentRole === "Super Admin" ? staff : staff.filter(s => s.company === currentUser.company);
  if (search) {
    allowedStaff = allowedStaff.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.position.toLowerCase().includes(search.toLowerCase()));
  }

  // Populate local state on mount or when salarySetups changes
  useEffect(() => {
    const initialLocal: Record<string, { basic: string; housing: string; transport: string }> = {};
    allowedStaff.forEach(s => {
      const setup = salarySetups.find(u => u.staffId === s.id) || { basic: 3000, housing: 1000, transport: 500 };
      initialLocal[s.id] = {
        basic: setup.basic.toString(),
        housing: setup.housing.toString(),
        transport: setup.transport.toString(),
      };
    });
    setLocalSetups(initialLocal);
  }, [salarySetups, staff]);

  const handleLocalUpdate = (staffId: string, field: string, value: string) => {
    setLocalSetups(prev => {
      const current = prev[staffId] || { basic: "3000", housing: "1000", transport: "500" };
      return {
        ...prev,
        [staffId]: {
          ...current,
          [field]: value
        }
      };
    });
  };

  const handleSave = () => {
    allowedStaff.forEach(s => {
      const local = localSetups[s.id];
      if (local) {
        const currentSetup = salarySetups.find(u => u.staffId === s.id) || { staffId: s.id, basic: 3000, housing: 1000, transport: 500 };
        updateSalarySetup({
          ...currentSetup,
          staffId: s.id,
          basic: parseInt(local.basic) || 0,
          housing: parseInt(local.housing) || 0,
          transport: parseInt(local.transport) || 0,
        });
      }
    });
    toast.success("Salary setups saved successfully");
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-slate-100 p-5 bg-white shadow-sm flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Salary Setup</h2>
            <p className="text-[10px] text-slate-500">Configure base salary and standard allowances</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-xs rounded-xl bg-slate-50 border-slate-200" />
          </div>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs h-9 px-4 gap-1.5 whitespace-nowrap">
            <Save className="w-4 h-4" /> Save Setup
          </Button>
        </div>
      </Card>

      {allowedStaff.length === 0 ? (
        <EmptyState title="No staff found" />
      ) : (
        <Card className="rounded-2xl border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Staff Member</th>
                  <th className="text-left px-4 py-3 w-40">Basic Salary (AED)</th>
                  <th className="text-left px-4 py-3 w-40">Housing (AED)</th>
                  <th className="text-left px-4 py-3 w-40">Transport (AED)</th>
                  <th className="text-left px-4 py-3 w-40">Gross Salary</th>
                </tr>
              </thead>
              <tbody>
                {allowedStaff.map(s => {
                  const local = localSetups[s.id] || { basic: "3000", housing: "1000", transport: "500" };
                  const gross = (parseInt(local.basic) || 0) + (parseInt(local.housing) || 0) + (parseInt(local.transport) || 0);
                  return (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/30 text-slate-600">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{s.name}</div>
                        <div className="text-[10px] text-slate-400">{s.position}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Input type="text" value={local.basic} onChange={e => handleLocalUpdate(s.id, "basic", e.target.value)} className="h-8 text-xs font-bold bg-white border-slate-200 focus:border-blue-400 rounded-lg" />
                      </td>
                      <td className="px-4 py-3">
                        <Input type="text" value={local.housing} onChange={e => handleLocalUpdate(s.id, "housing", e.target.value)} className="h-8 text-xs font-bold bg-white border-slate-200 focus:border-blue-400 rounded-lg" />
                      </td>
                      <td className="px-4 py-3">
                        <Input type="text" value={local.transport} onChange={e => handleLocalUpdate(s.id, "transport", e.target.value)} className="h-8 text-xs font-bold bg-white border-slate-200 focus:border-blue-400 rounded-lg" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-black text-slate-800">AED {gross.toLocaleString()}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
