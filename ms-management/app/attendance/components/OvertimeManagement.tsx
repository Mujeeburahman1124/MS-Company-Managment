"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

export default function OvertimeManagement() {
  const { currentRole, currentUser, overtimeRequests, updateOvertimeRequest, deleteOvertimeRequest, addActivityLog, staff } = useAuthStore();
  const [approveModal, setApproveModal] = useState<{ req: any; action: "Approved" | "Rejected" } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isSystemUser = currentUser.company === "System";
  const isAdmin = currentRole === "Super Admin" || 
                  currentRole === "Company Admin" || 
                  currentRole === "Branch Admin" || 
                  currentRole === "HR Manager" || 
                  currentRole === "Admin" || 
                  currentRole === "HR" ||
                  currentRole === "Recruiter" ||
                  currentRole === "Accountant";

  const currentStaff = staff.find(
    s => s.email?.toLowerCase() === currentUser.email?.toLowerCase() || 
         s.name?.toLowerCase() === currentUser.name?.toLowerCase()
  );

  let list = overtimeRequests;
  if (currentRole !== "Super Admin" && !isSystemUser) {
    list = list.filter(r => r.company === currentUser.company);
  }
  
  if (!isAdmin) {
    list = currentStaff ? list.filter(r => r.staffId === currentStaff.id) : [];
  }

  const handleApproveReject = () => {
    if (!approveModal) return;
    const { req, action } = approveModal;
    if (action === "Rejected" && !rejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    updateOvertimeRequest({ 
      ...req, 
      status: action, 
      approvedBy: currentUser.name, 
      approvedAt: new Date().toISOString().slice(0,10), 
      rejectReason: action === "Rejected" ? rejectReason : undefined 
    });
    
    addActivityLog({ id: `LOG-${Date.now()}`, dateTime: new Date().toISOString().replace("T", " ").slice(0, 19), userName: currentUser.name, role: currentUser.role, company: currentUser.company, branch: currentUser.branch, action: "Status Changed", module: "Overtime", oldValue: req.status, newValue: action, ipAddress: "192.168.1.102" });
    toast.success(`Overtime request ${action}`);
    setApproveModal(null);
    setRejectReason("");
  };

  return (
    <div className="space-y-4">
      {list.length === 0 ? (
        <EmptyState title="No Overtime Requests" description="There are no overtime requests to review." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map(req => (
            <Card key={req.id} className="rounded-2xl border-slate-100 p-5 bg-white shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-slate-800 text-sm">{req.staffName}</div>
                  <StatusBadge status={req.status} />
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                  <Clock className="w-3.5 h-3.5" />
                  {req.date}
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Hours Requested</span>
                    <span className="text-sm font-extrabold text-blue-600">{req.hours} Hrs</span>
                  </div>
                  <div className="text-xs text-slate-600 italic">"{req.reason}"</div>
                </div>
                {req.status === "Rejected" && req.rejectReason && (
                  <div className="text-[10px] text-rose-500 font-bold mb-3">Reason: {req.rejectReason}</div>
                )}
              </div>
              <div className="flex gap-2 items-center justify-end border-t border-slate-50 pt-3">
                {req.status === "Pending" && isAdmin && (
                  <>
                    <Button size="sm" onClick={() => setApproveModal({ req, action: "Approved" })} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[10px] h-8 px-3 gap-1"><CheckCircle className="w-3.5 h-3.5"/>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => setApproveModal({ req, action: "Rejected" })} className="border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl text-[10px] h-8 px-3 gap-1"><XCircle className="w-3.5 h-3.5"/>Reject</Button>
                  </>
                )}
                {(isAdmin || (currentStaff && req.staffId === currentStaff.id)) && (
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(req.id)} className="w-7 h-7 text-rose-400 hover:bg-rose-50 rounded-lg ml-auto"><Trash2 className="w-3.5 h-3.5"/></Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!approveModal} onOpenChange={open => !open && setApproveModal(null)}>
        <DialogContent className="rounded-3xl bg-white border border-slate-100 shadow-2xl p-6 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800">{approveModal?.action === "Approved" ? "Approve Overtime?" : "Reject Overtime?"}</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">{approveModal?.req.staffName} requested {approveModal?.req.hours} hours of overtime.</DialogDescription>
          </DialogHeader>
          {approveModal?.action === "Rejected" && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rejection Reason *</label>
              <textarea rows={2} value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl text-xs p-3 outline-none focus:border-blue-400 resize-none" placeholder="Enter reason..." />
            </div>
          )}
          <DialogFooter className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setApproveModal(null)} className="text-xs rounded-xl px-4">Cancel</Button>
            <Button onClick={handleApproveReject} className={`text-white font-bold rounded-xl text-xs px-5 h-10 ${approveModal?.action === "Approved" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}>{approveModal?.action}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog isOpen={!!deleteId} onOpenChange={open => !open && setDeleteId(null)} onConfirm={() => { deleteOvertimeRequest(deleteId!); toast.success("Deleted"); setDeleteId(null); }} title="Delete Overtime Request" description="Are you sure you want to delete this record?" confirmText="Delete" variant="danger" />
    </div>
  );
}
