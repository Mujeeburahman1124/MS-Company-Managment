"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Clock, Users, Edit, Trash2, Search, History } from "lucide-react";
import { Shift } from "@/lib/types";
import { toast } from "sonner";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";

export default function ShiftManagement() {
  const { 
    currentRole, currentUser, shifts, addShift, updateShift, deleteShift, 
    ownCompanies, branches, hasPermission, activityLogs, addActivityLog 
  } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<"list" | "logs">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");

  const [modal, setModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [form, setForm] = useState<Partial<Shift> & { company?: string; branch?: string }>({
    name: "", startTime: "09:00", endTime: "18:00", gracePeriod: 15, breakDuration: 60, description: "", assignedEmployees: [], overtimeEligible: "Yes", status: "Active",
    company: currentUser.company, branch: currentUser.branch
  });

  const canCreate = hasPermission("staff", "create");
  const canEdit = hasPermission("staff", "edit");
  const canDelete = hasPermission("staff", "delete");

  const isSuperAdmin = currentRole === "Super Admin";
  const isSystemUser = currentUser.company === "System";

  // Base list of shifts visible to the user
  const baseShifts = (isSuperAdmin || isSystemUser) ? shifts : shifts.filter(s => s.company === currentUser.company);

  // Apply filters (search, status, branch)
  const filteredShifts = baseShifts.filter(shift => {
    const matchesSearch = searchQuery === "" || 
      shift.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shift.description && shift.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || shift.status === statusFilter;
    
    const matchesBranch = !isSuperAdmin || branchFilter === "all" || shift.branch === branchFilter;

    return matchesSearch && matchesStatus && matchesBranch;
  });

  // Filter logs specifically for shifts
  const shiftLogs = activityLogs.filter(log => 
    log.module === "Shift" || 
    (log.action && log.action.toLowerCase().includes("shift"))
  );

  const companyOptions = isSuperAdmin ? ownCompanies : ownCompanies.filter(c => c.name === currentUser.company);
  const branchOptions = branches.filter(b => b.company === (form.company || currentUser.company));

  const resetForm = () => setForm({
    name: "", startTime: "09:00", endTime: "18:00", gracePeriod: 15, breakDuration: 60, description: "", assignedEmployees: [], overtimeEligible: "Yes", status: "Active",
    company: isSuperAdmin ? "" : currentUser.company, branch: isSuperAdmin ? "" : currentUser.branch
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.startTime || !form.endTime) { toast.error("Required fields missing"); return; }
    if (isSuperAdmin && (!form.company || !form.branch)) { toast.error("Company and Branch are required"); return; }

    const targetCompany = form.company || currentUser.company;
    const targetBranch = form.branch || currentUser.branch;

    setSubmitting(true);
    try {
      if (form.id) {
        const oldShift = shifts.find(s => s.id === form.id);
        await updateShift({ ...form as Shift, company: targetCompany, branch: targetBranch });
        
        addActivityLog({
          id: `LOG-${Date.now()}`,
          dateTime: new Date().toISOString().replace("T", " ").slice(0, 19),
          userName: currentUser.name,
          role: currentUser.role,
          company: currentUser.company,
          branch: currentUser.branch,
          action: "Edited",
          module: "Shift",
          oldValue: oldShift ? `${oldShift.name} (${oldShift.startTime}-${oldShift.endTime})` : "",
          newValue: `${form.name} (${form.startTime}-${form.endTime})`,
          ipAddress: "192.168.1.102"
        });

        toast.success("Shift updated successfully");
      } else {
        const newId = `SHF${Math.floor(100 + Math.random() * 900)}`;
        await addShift({
          ...form,
          id: newId,
          company: targetCompany,
          branch: targetBranch,
          createdBy: currentUser.name,
          createdAt: new Date().toISOString().slice(0, 10),
          assignedEmployees: form.assignedEmployees || [],
          overtimeEligible: form.overtimeEligible || "Yes",
          status: form.status || "Active"
        } as Shift);

        addActivityLog({
          id: `LOG-${Date.now()}`,
          dateTime: new Date().toISOString().replace("T", " ").slice(0, 19),
          userName: currentUser.name,
          role: currentUser.role,
          company: currentUser.company,
          branch: currentUser.branch,
          action: "Created",
          module: "Shift",
          oldValue: "",
          newValue: `${form.name} (${form.startTime}-${form.endTime})`,
          ipAddress: "192.168.1.102"
        });

        toast.success("New shift created");
      }
      setModal(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to save shift");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      const targetShift = shifts.find(s => s.id === deleteId);
      await deleteShift(deleteId);

      addActivityLog({
        id: `LOG-${Date.now()}`,
        dateTime: new Date().toISOString().replace("T", " ").slice(0, 19),
        userName: currentUser.name,
        role: currentUser.role,
        company: currentUser.company,
        branch: currentUser.branch,
        action: "Deleted",
        module: "Shift",
        oldValue: targetShift ? targetShift.name : "",
        newValue: "Deleted",
        ipAddress: "192.168.1.102"
      });

      toast.success("Shift deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete shift");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs Subnavigation */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("list")}
            className={cn(
              "text-xs font-bold pb-2 border-b-2 transition-all",
              activeTab === "list" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            Shift Configurations
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={cn(
              "text-xs font-bold pb-2 border-b-2 transition-all",
              activeTab === "logs" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            Shift Audit Trail
          </button>
        </div>
        {activeTab === "list" && canCreate && (
          <Button
            onClick={() => { resetForm(); setModal(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs h-9 px-4 gap-1.5"
          >
            <Plus className="w-4 h-4" /> Create Shift
          </Button>
        )}
      </div>

      {activeTab === "list" ? (
        <>
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search shifts by name or description..."
                className="pl-9 bg-slate-50 border-slate-200 rounded-xl h-9 text-xs w-full"
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl text-xs h-9 px-3 focus:outline-none min-w-[120px] w-full md:w-auto"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Disabled">Disabled</option>
              </select>
              {isSuperAdmin && (
                <select
                  value={branchFilter}
                  onChange={e => setBranchFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-xs h-9 px-3 focus:outline-none min-w-[150px] w-full md:w-auto"
                >
                  <option value="all">All Branches</option>
                  {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* Shifts Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredShifts.length === 0 ? (
              <div className="col-span-full p-8 text-center text-slate-400 font-semibold text-xs border border-dashed rounded-2xl bg-white border-slate-200">
                No shifts match the current search filters.
              </div>
            ) : filteredShifts.map(shift => (
              <Card key={shift.id} className="rounded-2xl border-slate-100 p-5 bg-white shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-slate-800">{shift.name}</div>
                      {isSuperAdmin && shift.company && (
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">{shift.company} · {shift.branch}</div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {canEdit && (
                        <button
                          onClick={() => { setForm({ ...shift, company: shift.company || currentUser.company, branch: shift.branch || currentUser.branch }); setModal(true); }}
                          className="p-1 text-slate-400 hover:text-blue-600"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => setDeleteId(shift.id)} className="p-1 text-slate-400 hover:text-rose-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
                    <span className={cn("px-2 py-1 rounded-md border", shift.overtimeEligible === "No" ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-emerald-50 text-emerald-600 border-emerald-100")}>
                      OT: {shift.overtimeEligible || "Yes"}
                    </span>
                    <span className={cn("px-2 py-1 rounded-md border", shift.status === "Disabled" ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-blue-50 text-blue-600 border-blue-100")}>
                      {shift.status || "Active"}
                    </span>
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
        </>
      ) : (
        /* Shift Audit Logs View */
        <Card className="rounded-2xl border-slate-100 bg-white shadow-sm overflow-hidden p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Shift History Log</h2>
              <p className="text-xs text-slate-500">Chronological history of shift creations, modifications, and deletions</p>
            </div>
          </div>

          <div className="space-y-4">
            {shiftLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-semibold text-xs border border-dashed rounded-2xl">No shift activity logged yet.</div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {shiftLogs.map((log, idx) => (
                    <li key={log.id}>
                      <div className="relative pb-8">
                        {idx !== shiftLogs.length - 1 && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100" aria-hidden="true" />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white text-white",
                              log.action === "Created" ? "bg-emerald-500" :
                              log.action === "Deleted" ? "bg-rose-500" : "bg-blue-500"
                            )}>
                              <Clock className="w-4 h-4" />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-xs font-bold text-slate-800">
                                {log.action} <span className="font-semibold text-slate-500">by {log.userName} ({log.role})</span>
                              </p>
                              {log.newValue && (
                                <p className="text-[10px] text-slate-400 mt-1 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                                  {log.oldValue && <><span className="text-slate-500">From:</span> {log.oldValue} <br/></>}
                                  <span className="text-slate-500">{log.oldValue ? "To:" : "Value:"}</span> {log.newValue}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-[10px] font-bold text-slate-400 whitespace-nowrap">
                              {new Date(log.dateTime).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Create/Edit Shift Dialog */}
      <Dialog open={modal} onOpenChange={open => { setModal(open); if (!open) resetForm(); }}>
        <DialogContent className="rounded-3xl bg-white border border-slate-100 shadow-2xl p-0 max-w-md w-[95vw] max-h-[92vh] flex flex-col overflow-hidden">
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
              <DialogTitle className="text-base font-bold text-slate-800">{form.id ? "Edit Shift" : "Create Shift"}</DialogTitle>
              <DialogDescription className="text-xs text-slate-400">Configure standard working hours and grace periods.</DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-0">
              {isSuperAdmin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Company *</Label>
                    <select
                      required
                      value={form.company || ""}
                      onChange={e => setForm(f => ({ ...f, company: e.target.value, branch: "" }))}
                      className="w-full bg-white border border-slate-200 rounded-xl text-xs h-9 px-3 focus:border-blue-400 focus:outline-none"
                    >
                      <option value="">Select Company</option>
                      {companyOptions.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Branch *</Label>
                    <select
                      required
                      value={form.branch || ""}
                      onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl text-xs h-9 px-3 focus:border-blue-400 focus:outline-none"
                    >
                      <option value="">Select Branch</option>
                      {branchOptions.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
              )}
              
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Shift Name *</Label>
                <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-white border-slate-200 rounded-xl text-xs h-9" placeholder="e.g. Morning Shift" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Start Time *</Label>
                  <Input type="time" required value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className="bg-white border-slate-200 rounded-xl text-xs h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">End Time *</Label>
                  <Input type="time" required value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className="bg-white border-slate-200 rounded-xl text-xs h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Grace Period (mins)</Label>
                  <Input type="number" min="0" value={form.gracePeriod} onChange={e => setForm(f => ({ ...f, gracePeriod: parseInt(e.target.value) || 0 }))} className="bg-white border-slate-200 rounded-xl text-xs h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Break (mins)</Label>
                  <Input type="number" min="0" value={form.breakDuration} onChange={e => setForm(f => ({ ...f, breakDuration: parseInt(e.target.value) || 0 }))} className="bg-white border-slate-200 rounded-xl text-xs h-9" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Overtime Eligible</Label>
                  <select
                    value={form.overtimeEligible || "Yes"}
                    onChange={e => setForm(f => ({ ...f, overtimeEligible: e.target.value }))}
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
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl text-xs h-9 px-3 focus:border-blue-400 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-white border-slate-200 rounded-xl text-xs h-9" placeholder="Optional notes about this shift" />
              </div>
            </div>
            
            <DialogFooter className="flex gap-2 justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
              <Button type="button" variant="ghost" onClick={() => setModal(false)} className="text-xs rounded-xl px-4">Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-blue-600 text-white font-bold rounded-xl text-xs px-5 h-10">
                {submitting ? "Saving..." : "Save Shift"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deleteId}
        onOpenChange={open => !open && setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Shift"
        description="This action cannot be undone. All staff assigned to this shift will need to be reassigned."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
