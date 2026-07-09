"use client";

import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";

export default function AttendanceReports() {
  const { currentRole, currentUser, ownCompanies, branches } = useAuthStore();
  const isSystemUser = currentUser?.company === "System";
  const [reportType, setReportType] = useState("monthly");
  const [format, setFormat] = useState("pdf");

  const handleDownload = () => {
    toast.success(`Downloading ${reportType} report as ${format.toUpperCase()}...`);
  };

  return (
    <div className="space-y-4 w-[95vw] sm:w-full max-w-3xl mx-auto">
      <Card className="rounded-2xl border-slate-100 p-6 bg-white shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Generate Reports</h2>
            <p className="text-xs text-slate-500">Export attendance and shift data</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Report Type</label>
              <Select value={reportType} onValueChange={v => setReportType(v || "monthly")}>
                <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Attendance</SelectItem>
                  <SelectItem value="monthly">Monthly Summary</SelectItem>
                  <SelectItem value="overtime">Overtime Report</SelectItem>
                  <SelectItem value="lateness">Lateness & Absences</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Format</label>
              <Select value={format} onValueChange={v => setFormat(v || "pdf")}>
                <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                  <SelectItem value="csv">CSV File</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(currentRole === "Super Admin" || isSystemUser) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Company</label>
                <Select defaultValue="all">
                  <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-10 text-xs"><SelectValue placeholder="All Companies" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {ownCompanies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Branch</label>
                <Select defaultValue="all">
                  <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-10 text-xs"><SelectValue placeholder="All Branches" /></SelectTrigger>
                  <SelectContent>
                    {currentRole === "Super Admin" && <SelectItem value="all">All Branches</SelectItem>}
                    {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-50 flex justify-end">
            <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs h-10 px-6 gap-2">
              {format === 'excel' || format === 'csv' ? <FileSpreadsheet className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              Generate Report
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
