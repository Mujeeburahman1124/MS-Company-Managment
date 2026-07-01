"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Clock, Users, Edit, Trash2 } from "lucide-react";
import { Shift } from "@/lib/types";
import { toast } from "sonner";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";

export default function ShiftManagement() {
  const { currentRole, currentUser, shifts, addShift, updateShift, deleteShift, staff, companies, branches, hasPermission } = useAuthStore();
  const [modal, setModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Shift>>({
    name: "", startTime: "09:00", endTime: "18:00", gracePeriod: 15, breakDuration: 60, description: "", assignedEmployees: [], overtimeEligible: "Yes", status: "Active"
  });

  const canCreate = hasPermission("staff", "create");
  const canEdit = hasPermission("staff", "edit");
  const canDelete = hasPermission("staff", "delete");

  const isSystemUser = currentUser.company === "System";
  let visibleShifts = (currentRole === "Super Admin" || isSystemUser) ? shifts : shifts.filter(s => s.company === currentUser.company);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.startTime || !form.endTime) { toast.error("Required fields missing"); return; }
    
    // Allow overnight shifts (where end time might be earlier than start time, e.g. 19:00 to 07:00)
    
    if (form.id) {
      updateShift(form as Shift);
      toast.success("Shift updated successfully");
    } else {
      addShift({
        ...form,
        id: `SHF${Math.floor(100+Math.random()*900)}`,
        company: currentUser.company,
        branch: currentUser.branch,
        createdBy: currentUser.name,
        createdAt: new Date().toISOString(),
        assignedEmployees: form.assignedEmployees || [],
        overtimeEligible: form.overtimeEligible || "Yes",
        status: form.status || "Active"
      } as Shift);
      toast.success("New shift created");
    }
    setModal(false);
  };

  const allowedStaff = (currentRole === "Super Admin" || isSystemUser) ? staff : staff.filter(s => s.company === currentUser.company);

  return (
    <div className="space-y-4">
      {canCreate && (
        <div className="flex justify-end">
          <Button onClick={() => { setForm({ name: "", startTime: "09:00", endTime: "18:00", gracePeriod: 15, breakDuration: 60, description: "", assignedEmployees: [], overtimeEligible: "Yes", status: "Active" }); setModal(true); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs h-9 px-4 gap-1.5">
            <Plus className="w-4 h-4" /> Create Shift
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleShifts.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-400 font-semibold text-xs border border-dashed rounded-2xl">No shifts defined.</div>
        ) : visibleShifts.map(shift => (
          <Card key={shift.id} className="rounded-2xl border-slate-100 p-5 bg-white shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="font-bold text-slate-800">{shift.name}</div>
                <div className="flex gap-1">
                  {canEdit && (
                    <button onClick={() => { setForm(shift); setModal(true); }} className="p-1 text-slate-400 hover:text-blue-600"><Edit className="w-3.5 h-3.5" /></button>
                  )}
                  {canDelete && (
                    <button onClick={() => setDeleteId(shift.id)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {shift.startTime} - {shift.endTime}
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] font-bold mt-3">
                <span className="bg-slate-50 text-slate-500 px-2 py-1 rounded-md border border-slate-100">Grace: {shift.gracePeriod}m</span>
                <span className="bg-slate-50 text-slate-500 px-2 py-1 rounded-md border border-slate-100">Break: {shift.breakDuration}m</span>
                <span className={cn("px-2 py-1 rounded-md border", shift.overtimeEligible === "No" ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-emerald-50 text-emerald-600 border-emerald-100")}>OT: {shift.overtimeEligible || "Yes"}</span>
                <span className={cn("px-2 py-1 rounded-md border", shift.status === "Disabled" ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-blue-50 text-blue-600 border-blue-100")}>{shift.status || "Active"}</span>
              </div>
              {shift.description && <div className="text-[10px] text-slate-400 mt-2 line-clamp-2">{shift.description}</div>}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <Users className="w-3.5 h-3.5" />
                {shift.assignedEmployees.length} Staff Assigned
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="rounded-3xl bg-white border border-slate-100 shadow-2xl p-6 max-w-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-800">{form.id ? "Edit Shift" : "Create Shift"}</DialogTitle>
              <DialogDescription className="text-xs text-slate-400">Configure standard working hours and grace periods.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Shift Name *</Label>
                <Input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="bg-white border-slate-200 rounded-xl text-xs h-9" placeholder="e.g. Morning Shift" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Start Time *</Label>
                  <Input type="time" required value={form.startTime} onChange={e => setForm(f => ({...f, startTime: e.target.value}))} className="bg-white border-slate-200 rounded-xl text-xs h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">End Time *</Label>
                  <Input type="time" required value={form.endTime} onChange={e => setForm(f => ({...f, endTime: e.target.value}))} className="bg-white border-slate-200 rounded-xl text-xs h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Grace Period (mins)</Label>
                  <Input type="number" value={form.gracePeriod} onChange={e => setForm(f => ({...f, gracePeriod: parseInt(e.target.value)||0}))} className="bg-white border-slate-200 rounded-xl text-xs h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Break (mins)</Label>
                  <Input type="number" value={form.breakDuration} onChange={e => setForm(f => ({...f, breakDuration: parseInt(e.target.value)||0}))} className="bg-white border-slate-200 rounded-xl text-xs h-9" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Overtime Eligible</Label>
                  <select 
                    value={form.overtimeEligible || "Yes"} 
                    onChange={e => setForm(f => ({...f, overtimeEligible: e.target.value}))}
                    className="w-full bg-white border border-slate-200 rounded-xl text-xs h-9 px-3 focus:border-blue-400 focus:outline-none"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</Label>
                  <select 
                    value={form.status || "Active"} 
                    onChange={e => setForm(f => ({...f, status: e.target.value}))}
                    className="w-full bg-white border border-slate-200 rounded-xl text-xs h-9 px-3 focus:border-blue-400 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</Label>
                <Input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="bg-white border-slate-200 rounded-xl text-xs h-9" />
              </div>
            </div>
            <DialogFooter className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="ghost" onClick={() => setModal(false)} className="text-xs rounded-xl px-4">Cancel</Button>
              <Button type="submit" className="bg-blue-600 text-white font-bold rounded-xl text-xs px-5 h-10">Save Shift</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog isOpen={!!deleteId} onOpenChange={open => !open && setDeleteId(null)} onConfirm={() => { deleteShift(deleteId!); toast.success("Shift deleted"); setDeleteId(null); }} title="Delete Shift" description="This action cannot be undone." confirmText="Delete" variant="danger" />
    </div>
  );
}
