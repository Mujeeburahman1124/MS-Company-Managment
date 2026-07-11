"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

export default function CreatePlacementModal({
  isOpen,
  onClose,
  applicant,
  onSubmitSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  applicant: any;
  onSubmitSuccess: (data: any) => void;
}) {
  const { companies } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    clientTradeLicense: "", clientAddress: "", clientCountry: "", clientContactPerson: "", clientContactNumber: "", clientEmail: "", clientLogo: "",
    companyName: "", position: applicant?.applyingPositions?.[0] || "", department: "", workLocation: "", city: "", joiningDate: "", contractDuration: "", probationPeriod: "", workingHours: "", weeklyOff: "", shiftDetails: "",
    salary: "", currency: "AED", paymentFrequency: "Monthly", foodAllowance: "", accommodation: "", transportation: "", overtime: "", medicalInsurance: "", airTicket: "", annualLeave: "", otherBenefits: "",
    visaStatus: "", placementVisaType: "", visaNumber: "", visaExpiryDate: "", visaProcessingStage: "", medicalStatus: "", emiratesIdStatus: "", labourContractStatus: "", joiningStatus: "",
    registrationFee: 0, placementFee: 0, paymentStatus: "Unpaid", paymentMethod: "", receiptNumber: "", dueAmount: 0, paidAmount: 0,
    placementDate: new Date().toISOString().slice(0, 10),
    notes: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const companyName = e.target.value;
    const company = companies.find((c: any) => c.name === companyName);
    setFormData(prev => ({
      ...prev,
      companyName,
      clientContactPerson: prev.clientContactPerson,
      clientContactNumber: prev.clientContactNumber,
      clientEmail: company?.email || prev.clientEmail,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.placementDate) {
      toast.error("Company Name and Placement Date are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmitSuccess(formData);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create placement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl bg-white border border-slate-100 shadow-2xl p-0 w-[95vw] sm:w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        
        <div className="p-6 border-b border-slate-100">
          <DialogTitle className="text-xl font-black text-slate-800">Create Professional Placement</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-medium mt-1">
            Fill in the complete employment, salary, and visa details to generate the Placement Agreement.
          </DialogDescription>
        </div>

        <form id="placement-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 min-h-0">
          
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">1</span>
              Applicant Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div><Label className="text-slate-400 text-[10px] uppercase">Applicant ID</Label><div className="font-bold text-slate-700">{applicant?.id}</div></div>
              <div><Label className="text-slate-400 text-[10px] uppercase">Full Name</Label><div className="font-bold text-slate-700">{applicant?.fullName}</div></div>
              <div><Label className="text-slate-400 text-[10px] uppercase">Passport Number</Label><div className="font-bold text-slate-700">{applicant?.passportNumber || "-"}</div></div>
              <div><Label className="text-slate-400 text-[10px] uppercase">Nationality</Label><div className="font-bold text-slate-700">{applicant?.nationalityFlag} {applicant?.nationality}</div></div>
              <div><Label className="text-slate-400 text-[10px] uppercase">Mobile Number</Label><div className="font-bold text-slate-700">{applicant?.mobile || "-"}</div></div>
              <div><Label className="text-slate-400 text-[10px] uppercase">Email</Label><div className="font-bold text-slate-700">{applicant?.email || "-"}</div></div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">2</span>
              Placement Company Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1 md:col-span-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Client Company Name *</Label>
                <select name="companyName" value={formData.companyName} onChange={handleCompanyChange} className="w-full bg-white border border-slate-200 rounded-xl text-xs h-10 px-3 focus:border-blue-400" required>
                  <option value="">Select Company</option>
                  {companies.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Trade License Number</Label>
                <Input name="clientTradeLicense" value={formData.clientTradeLicense} onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Company Address</Label>
                <Input name="clientAddress" value={formData.clientAddress} onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Country</Label>
                <Input name="clientCountry" value={formData.clientCountry} onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Contact Person</Label>
                <Input name="clientContactPerson" value={formData.clientContactPerson} onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Contact Number</Label>
                <Input name="clientContactNumber" value={formData.clientContactNumber} onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Email Address</Label>
                <Input name="clientEmail" type="email" value={formData.clientEmail} onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">3</span>
              Employment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Job Title *</Label>
                <Input name="position" value={formData.position} onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10" required />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Department</Label>
                <Input name="department" value={formData.department} onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Joining Date</Label>
                <Input name="joiningDate" type="date" value={formData.joiningDate} onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Work Location / City</Label>
                <Input name="workLocation" value={formData.workLocation} onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Contract Duration</Label>
                <select name="contractDuration" value={formData.contractDuration} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs h-10 px-3 focus:border-blue-400">
                  <option value="">Select Duration</option>
                  <option value="1 Year">1 Year</option>
                  <option value="2 Years">2 Years</option>
                  <option value="Unlimited">Unlimited</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Probation Period</Label>
                <Input name="probationPeriod" value={formData.probationPeriod} placeholder="e.g. 6 Months" onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Working Hours</Label>
                <Input name="workingHours" value={formData.workingHours} placeholder="e.g. 9 hours/day" onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Weekly Off</Label>
                <Input name="weeklyOff" value={formData.weeklyOff} placeholder="e.g. 1 Day (Friday)" onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Shift Timing</Label>
                <select 
                  name="shiftDetails" 
                  value={formData.shiftDetails} 
                  onChange={handleChange} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs h-10 px-3 outline-none focus:bg-white focus:border-blue-400 transition-all font-semibold text-slate-700"
                >
                  <option value="">Select Shift</option>
                  <option value="Morning Shift (07:30 AM - 05:30 PM Dubai / 09:00 AM - 07:00 PM Sri Lanka)">Morning Shift (07:30 AM - 05:30 PM Dubai / 09:00 AM - 07:00 PM Sri Lanka)</option>
                  <option value="Morning Shift (08:30 AM - 06:30 PM Dubai / 10:00 AM - 08:00 PM Sri Lanka)">Morning Shift (08:30 AM - 06:30 PM Dubai / 10:00 AM - 08:00 PM Sri Lanka)</option>
                  <option value="Night Shift (05:00 PM - 02:00 AM Dubai / 06:30 PM - 03:30 AM Sri Lanka)">Night Shift (05:00 PM - 02:00 AM Dubai / 06:30 PM - 03:30 AM Sri Lanka)</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Placement Date *</Label>
                <Input name="placementDate" type="date" value={formData.placementDate} onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10" required />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">4</span>
              Salary & Benefits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Basic Salary</Label>
                <div className="flex gap-2">
                  <Input name="salary" type="number" value={formData.salary} onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10 w-full" placeholder="0.00" />
                  <select name="currency" value={formData.currency} onChange={handleChange} className="w-24 bg-slate-50 border border-slate-200 rounded-xl text-xs h-10 px-2 focus:border-blue-400">
                    <option value="AED">AED</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Food Allowance</Label>
                <Input name="foodAllowance" value={formData.foodAllowance} placeholder="e.g. Provided by company" onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Accommodation</Label>
                <Input name="accommodation" value={formData.accommodation} placeholder="e.g. Provided by company" onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Transportation</Label>
                <Input name="transportation" value={formData.transportation} placeholder="e.g. Provided" onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Medical Insurance</Label>
                <Input name="medicalInsurance" value={formData.medicalInsurance} placeholder="e.g. Provided as per UAE Law" onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Air Ticket</Label>
                <Input name="airTicket" value={formData.airTicket} placeholder="e.g. Every 2 years" onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10" />
              </div>
              <div className="space-y-1 md:col-span-3">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Other Benefits</Label>
                <Textarea name="otherBenefits" value={formData.otherBenefits} onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs min-h-[60px]" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">5</span>
              Visa Process Tracking
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Visa Type</Label>
                <select name="placementVisaType" value={formData.placementVisaType} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs h-10 px-3 focus:border-blue-400">
                  <option value="">Select Type</option>
                  <option value="Employment Visa">Employment Visa</option>
                  <option value="Visit Visa">Visit Visa</option>
                  <option value="Own Visa">Own Visa / Freelance</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Visa Processing Stage</Label>
                <select name="visaProcessingStage" value={formData.visaProcessingStage} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs h-10 px-3 focus:border-blue-400">
                  <option value="">Select Stage</option>
                  <option value="Documents Collected">Documents Collected</option>
                  <option value="Offer Letter Signed">Offer Letter Signed</option>
                  <option value="Quota Approved">Quota Approved</option>
                  <option value="Labour Approval">Labour Approval</option>
                  <option value="E-Visa Issued">E-Visa Issued</option>
                  <option value="Status Change">Status Change / In-Country</option>
                  <option value="Medical Done">Medical Done</option>
                  <option value="Emirates ID Biometrics">Emirates ID Biometrics</option>
                  <option value="Visa Stamped">Visa Stamped</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Visa Number</Label>
                <Input name="visaNumber" value={formData.visaNumber} onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">6</span>
              Placement Fee & Payments
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Registration Fee</Label>
                <Input name="registrationFee" type="number" value={formData.registrationFee} onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Placement Fee</Label>
                <Input name="placementFee" type="number" value={formData.placementFee} onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Payment Status</Label>
                <select name="paymentStatus" value={formData.paymentStatus} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs h-10 px-3 focus:border-blue-400">
                  <option value="Unpaid">Unpaid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Fully Paid">Fully Paid</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Paid Amount</Label>
                <Input name="paidAmount" type="number" value={formData.paidAmount} onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Due Amount</Label>
                <Input name="dueAmount" type="number" value={formData.dueAmount} onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Receipt Number</Label>
                <Input name="receiptNumber" value={formData.receiptNumber} onChange={handleChange} className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">7</span>
              Placement Notes
            </h3>
            <Textarea 
              name="notes" 
              value={formData.notes} 
              onChange={handleChange} 
              className="bg-slate-50 border-slate-200 rounded-xl text-xs min-h-[100px]" 
              placeholder="Add any internal remarks or notes regarding this placement..."
            />
          </div>

        </form>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 flex-shrink-0">
          <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl h-11 px-6 font-bold text-slate-600">Cancel</Button>
          <Button form="placement-form" type="submit" disabled={isSubmitting} className="rounded-xl h-11 px-8 font-bold bg-blue-600 text-white shadow-md hover:bg-blue-700">
            {isSubmitting ? "Processing..." : "Generate Placement & Agreement"}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
