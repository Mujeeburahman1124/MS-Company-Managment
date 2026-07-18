"use client";

import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState, useMemo } from "react";

export default function AttendanceReports() {
  const { currentRole, currentUser, ownCompanies, branches, staffAttendance, staff } = useAuthStore();
  const isSystemUser = currentUser?.company === "System";
  
  const [reportType, setReportType] = useState("monthly");
  const [format, setFormat] = useState("pdf");
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState("Jul");
  const [selectedYear, setSelectedYear] = useState(2026);
  
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("all");

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const YEARS = [2025, 2026, 2027];

  const reportData = useMemo(() => {
    // 1. Filter staff by role, company and branch
    let targetStaff = staff;
    if (currentRole !== "Super Admin") {
      targetStaff = targetStaff.filter(s => s.company === currentUser?.company);
    } else if (selectedCompany !== "all") {
      const compName = ownCompanies.find(c => c.id === selectedCompany)?.name;
      if (compName) targetStaff = targetStaff.filter(s => s.company === compName);
    }

    if (selectedBranch !== "all") {
      const brName = branches.find(b => b.id === selectedBranch)?.name;
      if (brName) targetStaff = targetStaff.filter(s => s.branch === brName);
    }

    // 2. Generate metrics based on reportType
    if (reportType === "daily") {
      const d = new Date(selectedDate);
      const y = d.getFullYear();
      const m = MONTHS[d.getMonth()];
      const dayStr = d.getDate().toString().padStart(2, "0");
      const dateKey = `${y}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${dayStr}`;

      return targetStaff.map(s => {
        const attDoc = staffAttendance.find(a => a.staffId === s.id && a.month === m && a.year === y);
        let records: any[] = [];
        try {
          records = typeof attDoc?.records === "string" ? JSON.parse(attDoc.records) : (attDoc?.records || []);
        } catch (e) {}
        const record = records.find((r: any) => r.date === dateKey);

        return {
          staffName: s.name,
          staffId: s.id,
          company: s.company,
          branch: s.branch,
          status: record?.status || "Not Marked",
          checkIn: record?.checkIn || "--:--",
          checkOut: record?.checkOut || "--:--",
          workingHours: record?.workingHours || 0,
          overtime: record?.overtime || 0,
          lateArrival: record?.lateArrival || 0,
          earlyLeaving: record?.earlyLeaving || 0,
          notes: record?.notes || ""
        };
      });
    }

    // For monthly, overtime, lateness summary
    return targetStaff.map(s => {
      const attDoc = staffAttendance.find(a => a.staffId === s.id && a.month === selectedMonth && a.year === selectedYear);
      let records: any[] = [];
      try {
        records = typeof attDoc?.records === "string" ? JSON.parse(attDoc.records) : (attDoc?.records || []);
      } catch (e) {}

      let present = 0;
      let absent = 0;
      let leave = 0;
      let workingHours = 0;
      let overtime = 0;
      let lateArrival = 0;
      let lateCount = 0;

      records.forEach((r: any) => {
        if (["Present", "Late", "Half Day", "Work From Home"].includes(r.status)) present++;
        if (r.status === "Absent") absent++;
        if (r.status === "Leave") leave++;
        if (r.workingHours) workingHours += r.workingHours;
        if (r.overtime) overtime += r.overtime;
        if (r.lateArrival) {
          lateArrival += r.lateArrival;
          lateCount++;
        } else if (r.status === "Late") {
          lateCount++;
        }
      });

      return {
        staffName: s.name,
        staffId: s.id,
        company: s.company,
        branch: s.branch,
        present,
        absent,
        leave,
        workingHours: parseFloat(workingHours.toFixed(2)),
        overtime: parseFloat(overtime.toFixed(2)),
        lateArrival,
        lateCount
      };
    });
  }, [staff, staffAttendance, reportType, selectedDate, selectedMonth, selectedYear, selectedCompany, selectedBranch, ownCompanies, branches, currentRole, currentUser]);

  const downloadCSV = (data: any[], headers: string[], keys: string[], filename: string) => {
    const csvContent = [
      headers.join(","),
      ...data.map(row => 
        keys.map(key => {
          let val = row[key];
          if (val === undefined || val === null) return "";
          const valStr = String(val).replace(/"/g, '""');
          return valStr.includes(",") || valStr.includes("\n") || valStr.includes('"') ? `"${valStr}"` : valStr;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = () => {
    if (format === "csv" || format === "excel") {
      const isDaily = reportType === "daily";
      const headers = isDaily 
        ? ["Employee Name", "Employee ID", "Company", "Branch", "Status", "Check-In", "Check-Out", "Hours Worked", "Overtime Hours", "Late (min)", "Notes"]
        : reportType === "overtime"
        ? ["Employee Name", "Employee ID", "Company", "Branch", "Month", "Year", "Total Overtime Hours"]
        : reportType === "lateness"
        ? ["Employee Name", "Employee ID", "Company", "Branch", "Month", "Year", "Lateness Days", "Total Lateness Mins"]
        : ["Employee Name", "Employee ID", "Company", "Branch", "Month", "Year", "Present Days", "Absent Days", "Leave Days", "Total Hours Worked", "Total Overtime"];

      const keys = isDaily 
        ? ["staffName", "staffId", "company", "branch", "status", "checkIn", "checkOut", "workingHours", "overtime", "lateArrival", "notes"]
        : reportType === "overtime"
        ? ["staffName", "staffId", "company", "branch", "month", "year", "overtime"]
        : reportType === "lateness"
        ? ["staffName", "staffId", "company", "branch", "month", "year", "lateCount", "lateArrival"]
        : ["staffName", "staffId", "company", "branch", "month", "year", "present", "absent", "leave", "workingHours", "overtime"];

      const dataToExport = reportData.map(r => ({
        ...r,
        month: selectedMonth,
        year: selectedYear
      }));

      downloadCSV(dataToExport, headers, keys, `attendance_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success("Report downloaded successfully as CSV");
    } else {
      // PDF Print Window
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Popup blocker prevented opening the print window.");
        return;
      }

      const title = reportType === "daily" 
        ? `Daily Attendance Report - ${selectedDate}` 
        : `${reportType.replace(/_/g, ' ').toUpperCase()} - ${selectedMonth} ${selectedYear}`;

      const headersHtml = reportType === "daily" 
        ? `<tr><th>Employee</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Overtime</th><th>Notes</th></tr>`
        : reportType === "overtime"
        ? `<tr><th>Employee</th><th>Total Overtime Hours</th></tr>`
        : reportType === "lateness"
        ? `<tr><th>Employee</th><th>Late Incidents</th><th>Total Lateness (mins)</th></tr>`
        : `<tr><th>Employee</th><th>Present</th><th>Absent</th><th>Leave</th><th>Working Hours</th><th>Overtime</th></tr>`;

      const rowsHtml = reportData.map(row => {
        if (reportType === "daily") {
          return `
            <tr>
              <td>${row.staffName}<br/><small style="color: #64748b;">${row.staffId}</small></td>
              <td><span style="padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; background-color: ${
                row.status === 'Present' ? '#dcfce7; color: #166534;' :
                row.status === 'Absent' ? '#fee2e2; color: #991b1b;' :
                row.status === 'Late' ? '#fef9c3; color: #854d0e;' : '#f1f5f9; color: #475569;'
              }">${row.status}</span></td>
              <td>${row.checkIn}</td>
              <td>${row.checkOut}</td>
              <td>${row.workingHours} hrs</td>
              <td>${row.overtime} hrs</td>
              <td>${row.notes || ""}</td>
            </tr>
          `;
        } else if (reportType === "overtime") {
          return `
            <tr>
              <td>${row.staffName}<br/><small style="color: #64748b;">${row.staffId}</small></td>
              <td><strong>${row.overtime} hrs</strong></td>
            </tr>
          `;
        } else if (reportType === "lateness") {
          return `
            <tr>
              <td>${row.staffName}<br/><small style="color: #64748b;">${row.staffId}</small></td>
              <td>${row.lateCount} days</td>
              <td>${row.lateArrival} minutes</td>
            </tr>
          `;
        } else {
          return `
            <tr>
              <td>${row.staffName}<br/><small style="color: #64748b;">${row.staffId}</small></td>
              <td>${row.present} days</td>
              <td>${row.absent} days</td>
              <td>${row.leave} days</td>
              <td>${row.workingHours} hrs</td>
              <td>${row.overtime} hrs</td>
            </tr>
          `;
        }
      }).join("");

      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: sans-serif; padding: 30px; color: #1e293b; }
              h1 { font-size: 18px; margin-bottom: 5px; color: #1e3a8a; }
              p { font-size: 11px; margin-bottom: 20px; color: #64748b; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
              th { background-color: #f8fafc; font-weight: bold; color: #0f172a; text-transform: uppercase; }
              tr:hover { background-color: #f8fafc; }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <p>Generated on ${new Date().toLocaleDateString()} · Format: PDF Document</p>
            <table>
              <thead>
                ${headersHtml}
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6 w-[95vw] sm:w-full max-w-4xl mx-auto">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportType === "daily" ? (
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Date</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="bg-slate-50 border-slate-200 rounded-xl h-10 text-xs"
                />
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Month</label>
                  <Select value={selectedMonth} onValueChange={v => setSelectedMonth(v || "Jul")}>
                    <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Year</label>
                  <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(Number(v) || 2026)}>
                    <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          {(currentRole === "Super Admin" || isSystemUser) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Company</label>
                <Select value={selectedCompany} onValueChange={v => setSelectedCompany(v || "all")}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-10 text-xs"><SelectValue placeholder="All Companies" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {ownCompanies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Branch</label>
                <Select value={selectedBranch} onValueChange={v => setSelectedBranch(v || "all")}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-10 text-xs"><SelectValue placeholder="All Branches" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.filter(b => selectedCompany === "all" || b.company === ownCompanies.find(c => c.id === selectedCompany)?.name).map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
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

      {/* Report Preview Section */}
      <Card className="rounded-2xl border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-800">Report Preview</h3>
          <div className="text-xs text-slate-500 font-medium">Showing {reportData.length} records</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {reportType === "daily" ? (
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="p-4 font-bold">Employee</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Check-In</th>
                  <th className="p-4 font-bold">Check-Out</th>
                  <th className="p-4 font-bold">Hours Worked</th>
                  <th className="p-4 font-bold">Overtime Hours</th>
                  <th className="p-4 font-bold">Notes</th>
                </tr>
              ) : reportType === "overtime" ? (
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="p-4 font-bold">Employee</th>
                  <th className="p-4 font-bold">Period</th>
                  <th className="p-4 font-bold">Total Overtime Hours</th>
                </tr>
              ) : reportType === "lateness" ? (
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="p-4 font-bold">Employee</th>
                  <th className="p-4 font-bold">Period</th>
                  <th className="p-4 font-bold">Late Incidents</th>
                  <th className="p-4 font-bold">Total Lateness (mins)</th>
                </tr>
              ) : (
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="p-4 font-bold">Employee</th>
                  <th className="p-4 font-bold">Period</th>
                  <th className="p-4 font-bold">Present</th>
                  <th className="p-4 font-bold">Absent</th>
                  <th className="p-4 font-bold">Leave</th>
                  <th className="p-4 font-bold">Total Working Hours</th>
                  <th className="p-4 font-bold">Total Overtime</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-sm">No data available for the selected filters.</td>
                </tr>
              ) : (
                reportData.map((row: any, i) => {
                  if (reportType === "daily") {
                    return (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-800 text-xs">{row.staffName}</div>
                          <div className="text-[10px] text-slate-500">{row.staffId}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            row.status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                            row.status === 'Absent' ? 'bg-rose-100 text-rose-700' :
                            row.status === 'Late' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-semibold text-slate-600">{row.checkIn}</td>
                        <td className="p-4 text-xs font-semibold text-slate-600">{row.checkOut}</td>
                        <td className="p-4 text-xs font-semibold text-slate-600">{row.workingHours} hrs</td>
                        <td className="p-4 text-xs font-semibold text-slate-600">{row.overtime} hrs</td>
                        <td className="p-4 text-xs text-slate-500 italic max-w-xs truncate">{row.notes || "-"}</td>
                      </tr>
                    );
                  } else if (reportType === "overtime") {
                    return (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-800 text-xs">{row.staffName}</div>
                          <div className="text-[10px] text-slate-500">{row.staffId}</div>
                        </td>
                        <td className="p-4 text-xs text-slate-600 font-medium">{selectedMonth} {selectedYear}</td>
                        <td className="p-4 text-xs font-bold text-emerald-600">{row.overtime} hrs</td>
                      </tr>
                    );
                  } else if (reportType === "lateness") {
                    return (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-800 text-xs">{row.staffName}</div>
                          <div className="text-[10px] text-slate-500">{row.staffId}</div>
                        </td>
                        <td className="p-4 text-xs text-slate-600 font-medium">{selectedMonth} {selectedYear}</td>
                        <td className="p-4 text-xs font-semibold text-amber-700">{row.lateCount} days</td>
                        <td className="p-4 text-xs font-bold text-rose-600">{row.lateArrival} mins</td>
                      </tr>
                    );
                  } else {
                    return (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-800 text-xs">{row.staffName}</div>
                          <div className="text-[10px] text-slate-500">{row.staffId}</div>
                        </td>
                        <td className="p-4 text-xs text-slate-600 font-medium">{selectedMonth} {selectedYear}</td>
                        <td className="p-4 text-xs text-slate-600">{row.present} days</td>
                        <td className="p-4 text-xs text-slate-600">{row.absent} days</td>
                        <td className="p-4 text-xs text-slate-600">{row.leave} days</td>
                        <td className="p-4 text-xs font-bold text-slate-700">{row.workingHours} hrs</td>
                        <td className="p-4 text-xs font-bold text-emerald-600">{row.overtime} hrs</td>
                      </tr>
                    );
                  }
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
