"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Clock, UserCheck, UserMinus, ArrowRight, Play, Square, 
  CheckCircle2, XCircle, AlertCircle, Sparkles, Building, Calendar
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

function calcHours(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(`2000-01-01T${checkIn}`);
  const end = new Date(`2000-01-01T${checkOut}`);
  const diff = (end.getTime() - start.getTime()) / 3_600_000;
  return diff > 0 ? parseFloat(diff.toFixed(2)) : 0;
}

export function AttendanceWidget() {
  const { 
    currentUser, 
    currentRole, 
    staff, 
    staffAttendance, 
    saveAttendance, 
    addActivityLog,
    shifts
  } = useAuthStore();

  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Update clock every second
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const todayStr = useMemo(() => {
    return new Date().toISOString().slice(0, 10);
  }, []);

  const monthStr = useMemo(() => {
    return new Date().toLocaleString("default", { month: "short" });
  }, []);

  const yearNum = useMemo(() => {
    return new Date().getFullYear();
  }, []);

  // 1. Identify staff profile linked to current user
  const currentStaff = useMemo(() => {
    return staff.find(
      s => s.email?.toLowerCase() === currentUser.email?.toLowerCase() || 
           s.name?.toLowerCase() === currentUser.name?.toLowerCase()
    );
  }, [staff, currentUser]);

  // 2. Load today's record for the current user
  const todayRecord = useMemo(() => {
    if (!currentStaff) return null;
    const saDoc = staffAttendance.find(
      a => a.staffId === currentStaff.id && a.month === monthStr && a.year === yearNum
    );
    return saDoc?.records.find(r => r.date === todayStr) || null;
  }, [currentStaff, staffAttendance, todayStr, monthStr, yearNum]);

  // 3. Filtered staff list for company
  const isSystemUser = currentUser.company === "System";
  const allowedStaff = useMemo(() => {
    return (currentRole === "Super Admin" || isSystemUser)
      ? staff
      : staff.filter(s => s.company === currentUser.company);
  }, [staff, currentRole, currentUser.company, isSystemUser]);

  // 4. Calculate stats for the admin team panel
  const adminStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;
    const markedIds = new Set<string>();

    staffAttendance.forEach(sa => {
      const todayRec = sa.records.find(r => r.date === todayStr);
      if (todayRec && allowedStaff.some(s => s.id === sa.staffId)) {
        markedIds.add(sa.staffId);
        if (todayRec.status === "Present" || todayRec.status === "Work From Home") present++;
        else if (todayRec.status === "Absent") absent++;
        else if (todayRec.status === "Late") late++;
        else if (todayRec.status === "Leave" || todayRec.status === "Half Day") leave++;
      }
    });

    const total = allowedStaff.length;
    const marked = present + absent + late + leave;
    const unmarked = Math.max(0, total - marked);

    return { present, absent, late, leave, unmarked, total, marked };
  }, [staffAttendance, allowedStaff, todayStr]);

  // 5. Unmarked staff list for quick mark (max 3)
  const unmarkedStaff = useMemo(() => {
    const markedIds = new Set<string>();
    staffAttendance.forEach(sa => {
      if (sa.records.some(r => r.date === todayStr)) {
        markedIds.add(sa.staffId);
      }
    });
    return allowedStaff
      .filter(s => s.status === "Active" && !markedIds.has(s.id))
      .slice(0, 3);
  }, [allowedStaff, staffAttendance, todayStr]);

  // Clock formatters
  const formattedTimeStr = currentTime ? currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }) : "--:--:--";
  const formattedDateStr = currentTime ? currentTime.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) : "Loading...";

  const formatTime24h = (time: Date) => {
    return time.toTimeString().slice(0, 5); // "HH:MM"
  };

  // Clock-in handler
  const handleClockIn = async () => {
    if (!currentStaff) return;
    const nowTime = formatTime24h(new Date());

    const existingDoc = staffAttendance.find(
      a => a.staffId === currentStaff.id && a.month === monthStr && a.year === yearNum
    );

    const newRecord = {
      date: todayStr,
      status: "Present" as const,
      checkIn: nowTime,
      checkOut: "",
      workingHours: 0,
      notes: "Clocked in from Dashboard Widget",
      overtime: 0,
    };

    try {
      if (existingDoc) {
        const filtered = existingDoc.records.filter(r => r.date !== todayStr);
        await saveAttendance({
          ...existingDoc,
          records: [...filtered, newRecord]
        });
      } else {
        await saveAttendance({
          staffId: currentStaff.id,
          staffName: currentStaff.name,
          month: monthStr,
          year: yearNum,
          records: [newRecord]
        });
      }

      await addActivityLog({
        id: `LOG-${Date.now()}`,
        dateTime: new Date().toISOString().replace("T", " ").slice(0, 19),
        userName: currentUser.name,
        role: currentUser.role,
        company: currentUser.company,
        branch: currentUser.branch,
        action: "Created",
        module: "Attendance",
        oldValue: null,
        newValue: `${currentUser.name} clocked in at ${nowTime}`,
        ipAddress: "127.0.0.1"
      });

      toast.success(`⚡ Clocked in successfully at ${nowTime}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to record check-in");
    }
  };

  // Clock-out handler
  const handleClockOut = async () => {
    if (!currentStaff || !todayRecord) return;
    const nowTime = formatTime24h(new Date());

    const existingDoc = staffAttendance.find(
      a => a.staffId === currentStaff.id && a.month === monthStr && a.year === yearNum
    );

    if (!existingDoc) return;

    const checkIn = todayRecord.checkIn || "09:00";
    const workingHours = calcHours(checkIn, nowTime);

    // Calculate shift hours
    let shiftRequiredHours = 9; // default fallback
    const staffShift = shifts.find(s => s.id === currentStaff.shiftId);
    if (staffShift) {
      const shiftStart = staffShift.startTime || staffShift.clockIn || "09:00";
      const shiftEnd = staffShift.endTime || staffShift.clockOut || "18:00";
      const computedRequired = calcHours(shiftStart, shiftEnd);
      if (computedRequired > 0) {
        const breakHours = (staffShift.breakDuration || 0) / 60;
        shiftRequiredHours = Math.max(0, computedRequired - breakHours);
      }
    }

    const isOTEligible = staffShift ? staffShift.overtimeEligible !== "No" : true;
    const computedOvertime = (workingHours > shiftRequiredHours && isOTEligible) ? parseFloat((workingHours - shiftRequiredHours).toFixed(2)) : 0;

    const updatedRecord = {
      ...todayRecord,
      checkOut: nowTime,
      workingHours,
      overtime: computedOvertime,
      notes: todayRecord.notes ? `${todayRecord.notes} | Clocked out from Dashboard` : "Clocked out from Dashboard"
    };

    try {
      const filtered = existingDoc.records.filter(r => r.date !== todayStr);
      await saveAttendance({
        ...existingDoc,
        records: [...filtered, updatedRecord]
      });

      await addActivityLog({
        id: `LOG-${Date.now()}`,
        dateTime: new Date().toISOString().replace("T", " ").slice(0, 19),
        userName: currentUser.name,
        role: currentUser.role,
        company: currentUser.company,
        branch: currentUser.branch,
        action: "Edited",
        module: "Attendance",
        oldValue: `Check in: ${checkIn}`,
        newValue: `Clocked out at ${nowTime}, hours: ${workingHours}`,
        ipAddress: "127.0.0.1"
      });

      toast.success(`✅ Clocked out at ${nowTime}. Worked: ${workingHours}h`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to record check-out");
    }
  };

  // Quick mark handler for admin panel
  const handleQuickMark = async (staffMember: any, status: "Present" | "Absent") => {
    const newRecord = {
      date: todayStr,
      status,
      checkIn: status === "Present" ? "09:00" : "",
      checkOut: status === "Present" ? "18:00" : "",
      workingHours: status === "Present" ? 9 : 0,
      notes: "Quick marked from Dashboard",
      overtime: 0,
    };

    const existingDoc = staffAttendance.find(
      a => a.staffId === staffMember.id && a.month === monthStr && a.year === yearNum
    );

    try {
      if (existingDoc) {
        const filtered = existingDoc.records.filter(r => r.date !== todayStr);
        await saveAttendance({
          ...existingDoc,
          records: [...filtered, newRecord]
        });
      } else {
        await saveAttendance({
          staffId: staffMember.id,
          staffName: staffMember.name,
          month: monthStr,
          year: yearNum,
          records: [newRecord]
        });
      }

      await addActivityLog({
        id: `LOG-${Date.now()}`,
        dateTime: new Date().toISOString().replace("T", " ").slice(0, 19),
        userName: currentUser.name,
        role: currentUser.role,
        company: currentUser.company,
        branch: currentUser.branch,
        action: "Created",
        module: "Attendance",
        oldValue: null,
        newValue: `Admin quick-marked ${staffMember.name} as ${status} from Dashboard`,
        ipAddress: "127.0.0.1"
      });

      toast.success(`Marked ${staffMember.name} as ${status}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update attendance");
    }
  };

  const isSuperAdmin = currentRole === "Super Admin";
  const isAdmin = currentRole === "Super Admin" || 
                  currentRole === "Company Admin" || 
                  currentRole === "Branch Admin" || 
                  currentRole === "HR Manager" || 
                  currentRole === "Admin" || 
                  currentRole === "HR";

  return (
    <div className={cn(
      "grid gap-6 w-full",
      isAdmin && currentStaff && !isSuperAdmin ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1"
    )}>
      {/* ── Personal Workday Panel — Hidden for Super Admin ── */}
      {currentStaff && !isSuperAdmin && (
        <Card className={cn(
          "relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between",
          isAdmin ? "lg:col-span-5" : "w-full"
        )}>
          {/* Decorative background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -z-10 opacity-70" />
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Your Workday</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Daily Clock-In System</p>
                </div>
              </div>
              
              {todayRecord ? (
                <div className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1",
                  todayRecord.checkOut 
                    ? "bg-slate-100 text-slate-600" 
                    : "bg-emerald-50 text-emerald-600 animate-pulse"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", todayRecord.checkOut ? "bg-slate-400" : "bg-emerald-500")} />
                  {todayRecord.checkOut ? "Completed" : "Clocked In"}
                </div>
              ) : (
                <div className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-400 text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  Not Active
                </div>
              )}
            </div>

            {/* Time and Date display */}
            <div className="my-3 text-center lg:text-left">
              <div className="text-3xl font-black text-slate-800 tracking-tight font-mono">
                {formattedTimeStr}
              </div>
              <div className="text-xs text-slate-400 font-bold mt-1 flex items-center justify-center lg:justify-start gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                {formattedDateStr}
              </div>
            </div>

            {/* Clock-in Details */}
            {todayRecord && (
              <div className="grid grid-cols-2 gap-4 my-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Checked In</span>
                  <span className="text-xs font-black text-slate-700">{todayRecord.checkIn || "--:--"}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Checked Out</span>
                  <span className="text-xs font-black text-slate-700">{todayRecord.checkOut || "--:--"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-4">
            {!todayRecord ? (
              <Button 
                onClick={handleClockIn}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 group transition-all duration-300"
              >
                <Play className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
                Clock In Now
              </Button>
            ) : !todayRecord.checkOut ? (
              <Button 
                onClick={handleClockOut}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/10 flex items-center justify-center gap-2 group transition-all duration-300"
              >
                <Square className="w-4 h-4 fill-white group-hover:scale-115 transition-transform animate-pulse" />
                Clock Out
              </Button>
            ) : (
              <div className="text-center p-3 rounded-xl border border-emerald-100 bg-emerald-50/30 text-emerald-700 text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Great job! You checked out at {todayRecord.checkOut}.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── Admin Dashboard Controls (Admin Mode) ── */}
      {isAdmin && (
        <Card className={cn(
          "relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300",
          currentStaff && !isSuperAdmin ? "lg:col-span-7" : "w-full"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Team Attendance Today</h3>
                <p className="text-[10px] text-slate-400 font-medium">Daily Operations Control</p>
              </div>
            </div>
            
            <Link href="/attendance?tab=Records">
              <Button variant="ghost" className="h-8 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 rounded-lg flex items-center gap-1">
                View Sheet
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Left: Summary Chart */}
            <div className="md:col-span-5 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-4">
              <div className="flex items-end justify-between mb-1.5">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Status marked</span>
                <span className="text-lg font-black text-slate-800">
                  {adminStats.marked} / {adminStats.total}
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 rounded-full" 
                  style={{ width: `${adminStats.total > 0 ? (adminStats.marked / adminStats.total) * 100 : 0}%` }}
                />
              </div>

              {/* Counts Grid */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500">
                <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  Present: {adminStats.present + adminStats.late}
                </div>
                <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  Absent: {adminStats.absent}
                </div>
                <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  Leave: {adminStats.leave}
                </div>
                <div className="flex items-center gap-1.5 p-1.5 bg-amber-50 rounded-lg text-amber-800">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  Unmarked: {adminStats.unmarked}
                </div>
              </div>
            </div>

            {/* Right: Quick Mark Unmarked Staff */}
            <div className="md:col-span-7 space-y-3">
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Quick Mark Unmarked Staff</h4>
              
              {unmarkedStaff.length > 0 ? (
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {unmarkedStaff.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-all duration-200">
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="text-xs font-bold text-slate-800 truncate">{s.name}</div>
                        <div className="text-[9px] text-slate-400 font-semibold truncate">{s.position}</div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleQuickMark(s, "Present")}
                          className="h-7 w-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 p-0 flex items-center justify-center transition-all"
                          title="Mark Present"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleQuickMark(s, "Absent")}
                          className="h-7 w-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 p-0 flex items-center justify-center transition-all"
                          title="Mark Absent"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[120px] rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-4">
                  <div className="p-2 rounded-full bg-emerald-50 text-emerald-500 mb-2">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-black text-slate-700">All attendance marked!</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">Everyone is tracked for today.</div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
