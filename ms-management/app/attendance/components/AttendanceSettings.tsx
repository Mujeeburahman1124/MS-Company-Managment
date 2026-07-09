"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Settings, Save } from "lucide-react";

export default function AttendanceSettings() {
  const handleSave = () => {
    toast.success("Attendance settings saved successfully");
  };

  return (
    <div className="space-y-4 w-[95vw] sm:w-full max-w-3xl mx-auto">
      <Card className="rounded-2xl border-slate-100 p-6 bg-white shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Module Settings</h2>
            <p className="text-xs text-slate-500">Configure global attendance rules</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between py-3 border-b border-slate-50">
            <div>
              <Label className="text-sm font-bold text-slate-800">Auto-Absent Rules</Label>
              <p className="text-[10px] text-slate-500">Automatically mark staff absent if no check-in by a certain time.</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-slate-50">
            <div>
              <Label className="text-sm font-bold text-slate-800">Overtime Approval Required</Label>
              <p className="text-[10px] text-slate-500">Require HR/Admin approval before overtime is counted towards payroll.</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="space-y-2 py-3 border-b border-slate-50">
            <Label className="text-sm font-bold text-slate-800">Weekend Days</Label>
            <p className="text-[10px] text-slate-500 mb-2">Select which days are considered weekends.</p>
            <Select defaultValue="sat-sun">
              <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl text-xs h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fri-sat">Friday - Saturday</SelectItem>
                <SelectItem value="sat-sun">Saturday - Sunday</SelectItem>
                <SelectItem value="sun">Sunday Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 flex justify-end">
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs h-10 px-6 gap-2">
              <Save className="w-4 h-4" /> Save Settings
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
