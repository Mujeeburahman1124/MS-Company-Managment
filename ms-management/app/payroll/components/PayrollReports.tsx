"use client";

import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { PayrollRecord } from "@/lib/types";

export default function PayrollReports() {
  const { currentRole, currentUser, ownCompanies, branches, payroll } = useAuthStore();
  const [reportType, setReportType] = useState("monthly_summary");
  const [format, setFormat] = useState("pdf");
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("all");

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
      const headers = reportType === "overtime_costs" 
        ? ["Employee Name", "Employee ID", "Period", "Overtime Hours", "Overtime Rate", "Overtime Cost", "Company", "Branch"]
        : reportType === "deductions"
        ? ["Employee Name", "Employee ID", "Period", "Deductions", "Advance Deduction", "Loan Deduction", "Company", "Branch"]
        : reportType === "bank_transfer"
        ? ["Employee Name", "Employee ID", "Basic Salary", "Allowances", "Overtime", "Deductions", "Net Salary", "Company", "Branch"]
        : ["Employee Name", "Employee ID", "Period", "Company", "Branch", "Basic Salary", "Allowances", "Overtime", "Deductions", "Net Salary", "Status"];

      const keys = reportType === "overtime_costs"
        ? ["staffName", "staffId", "period", "overtimeHours", "overtimeRate", "overtime", "company", "branch"]
        : reportType === "deductions"
        ? ["staffName", "staffId", "period", "totalDeductions", "advanceDeduction", "loanDeduction", "company", "branch"]
        : reportType === "bank_transfer"
        ? ["staffName", "staffId", "basicSalary", "allowances", "overtime", "totalDeductions", "netSalary", "company", "branch"]
        : ["staffName", "staffId", "period", "company", "branch", "basicSalary", "allowances", "overtime", "totalDeductions", "netSalary", "status"];

      const dataToExport = reportData.map(p => ({
        ...p,
        period: `${p.month} ${p.year}`,
        totalDeductions: (p.deductions || 0) + (p.advanceDeduction || 0) + (p.loanDeduction || 0)
      }));

      downloadCSV(dataToExport, headers, keys, `payroll_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success(`Report downloaded successfully as CSV`);
    } else {
      // PDF print window
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Popup blocker prevented opening the print window.");
        return;
      }
      
      const rowsHtml = reportData.map(row => `
        <tr>
          <td>${row.staffName}<br/><small style="color: #64748b;">${row.staffId}</small></td>
          <td>${row.month} ${row.year}</td>
          <td>AED ${row.basicSalary.toLocaleString()}</td>
          ${reportType === "overtime_costs" ? `<td>AED ${row.overtime.toLocaleString()}</td>` : ""}
          ${reportType === "deductions" ? `<td>AED ${((row.advanceDeduction||0) + (row.loanDeduction||0) + (row.deductions || 0)).toLocaleString()}</td>` : ""}
          <td><strong>AED ${row.netSalary.toLocaleString()}</strong></td>
          <td>${row.status}</td>
        </tr>
      `).join("");

      printWindow.document.write(`
        <html>
          <head>
            <title>Payroll Report - ${reportType.replace(/_/g, ' ').toUpperCase()}</title>
            <style>
              body { font-family: sans-serif; padding: 20px; color: #334155; }
              h1 { font-size: 20px; margin-bottom: 5px; color: #1e3a8a; }
              p { font-size: 12px; margin-bottom: 20px; color: #64748b; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
              th { background-color: #f8fafc; font-weight: bold; color: #0f172a; text-transform: uppercase; }
              tr:hover { background-color: #f1f5f9; }
            </style>
          </head>
          <body>
            <h1>Payroll Report - ${reportType.replace(/_/g, ' ').toUpperCase()}</h1>
            <p>Generated on ${new Date().toLocaleDateString()} · Format: PDF Document</p>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Period</th>
                  <th>Basic</th>
                  ${reportType === "overtime_costs" ? "<th>Overtime</th>" : ""}
                  ${reportType === "deductions" ? "<th>Deductions</th>" : ""}
                  <th>Net Salary</th>
                  <th>Status</th>
                </tr>
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

  const reportData = useMemo(() => {
    let data = payroll.filter(p => p.status === "Approved" || p.status === "Paid");
    
    if (currentRole !== "Super Admin") {
      data = data.filter(p => p.company === currentUser.company);
    } else if (selectedCompany !== "all") {
      const comp = ownCompanies.find(c => c.id === selectedCompany)?.name;
      if (comp) data = data.filter(p => p.company === comp);
    }

    if (selectedBranch !== "all") {
      const br = branches.find(b => b.id === selectedBranch)?.name;
      if (br) data = data.filter(p => p.branch === br);
    }

    // Sort by most recent
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    data = [...data].sort((a,b) => {
      if (a.year !== b.year) return b.year - a.year;
      return MONTHS.indexOf(b.month) - MONTHS.indexOf(a.month);
    });

    return data;
  }, [payroll, currentRole, currentUser, selectedCompany, selectedBranch, ownCompanies, branches]);

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-slate-100 p-6 bg-white shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Generate Payroll Reports</h2>
            <p className="text-xs text-slate-500">Export financial data, bank transfer files, and summaries</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Report Type</label>
              <Select value={reportType} onValueChange={v => setReportType(v || "monthly_summary")}>
                <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly_summary">Monthly Summary</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer (WPS)</SelectItem>
                  <SelectItem value="deductions">Deductions Report</SelectItem>
                  <SelectItem value="overtime_costs">Overtime Costs</SelectItem>
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

          {currentRole === "Super Admin" && (
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

      <Card className="rounded-2xl border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-800">Report Preview</h3>
          <div className="text-xs text-slate-500 font-medium">Showing {reportData.length} records</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="p-4 font-bold">Employee</th>
                <th className="p-4 font-bold">Period</th>
                <th className="p-4 font-bold">Basic</th>
                {reportType === "overtime_costs" && <th className="p-4 font-bold">Overtime</th>}
                {reportType === "deductions" && <th className="p-4 font-bold">Deductions</th>}
                <th className="p-4 font-bold">Net Salary</th>
                <th className="p-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-sm">No data available for the selected filters.</td>
                </tr>
              ) : (
                reportData.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800 text-xs">{row.staffName}</div>
                      <div className="text-[10px] text-slate-500">{row.staffId}</div>
                    </td>
                    <td className="p-4 text-xs text-slate-600 font-medium">{row.month} {row.year}</td>
                    <td className="p-4 text-xs font-medium text-slate-700">AED {row.basicSalary.toLocaleString()}</td>
                    {reportType === "overtime_costs" && (
                      <td className="p-4 text-xs font-bold text-emerald-600">AED {row.overtime.toLocaleString()}</td>
                    )}
                    {reportType === "deductions" && (
                      <td className="p-4 text-xs font-bold text-rose-600">AED {((row.advanceDeduction||0) + (row.loanDeduction||0) + (row.deductions || 0)).toLocaleString()}</td>
                    )}
                    <td className="p-4 text-xs font-black text-blue-600">AED {row.netSalary.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${row.status === 'Paid' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
