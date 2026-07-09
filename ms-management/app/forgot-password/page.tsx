"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { users, addPasswordResetRequest, addActivityLog } = useAuthStore();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }

    const matchedUser = users.find((user) => user.email.toLowerCase() === email.toLowerCase());

    if (!matchedUser) {
      toast.error("No user found with that email address.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const request = {
        id: `PWD${Date.now()}`,
        userId: matchedUser.id,
        email: matchedUser.email,
        requestedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
        status: "Sent" as const,
        requestedBy: "Self",
        note: "Password reset link requested from the login page."
      };

      addPasswordResetRequest(request);
      addActivityLog({
        id: `LOG-${Date.now()}`,
        dateTime: new Date().toISOString().replace("T", " ").slice(0, 19),
        userName: matchedUser.name,
        role: matchedUser.role,
        company: matchedUser.company,
        branch: matchedUser.branch,
        action: "Password Reset",
        module: "Security",
        oldValue: null,
        newValue: `Password reset requested for ${matchedUser.email}`,
        ipAddress: "192.168.1.50"
      });

      toast.success(`Password reset link sent to ${matchedUser.email}`);
      setSubmitted(true);
      setIsSubmitting(false);
      setTimeout(() => router.push("/login"), 1800);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full w-[95vw] sm:w-full max-w-md">
        <Card className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <h1 className="mt-4 text-lg font-bold text-white">Forgot Password</h1>
            <p className="mt-2 text-[11px] text-slate-400">Enter your email and we will send a reset link to your inbox.</p>
          </div>

          {submitted ? (
            <div className="rounded-3xl border border-emerald-500 bg-emerald-950/10 p-5 text-sm text-emerald-200">
              A password reset link has been sent to <strong>{email}</strong>. Check your inbox and then return to the login page.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Email Address
                </Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white rounded-2xl text-xs h-11 px-4"
                  required
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs h-11">
                {isSubmitting ? "Sending reset link..." : "Send Reset Link"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-[11px] text-slate-500">
            Remembered your password?{' '}
            <Link href="/login" className="font-semibold text-blue-400 hover:text-blue-300">
              Return to login
            </Link>
          </div>
          <Button variant="ghost" size="sm" className="mt-5 w-full text-slate-300 border border-slate-800 hover:bg-slate-800" onClick={() => router.push('/login')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to login
          </Button>
        </Card>
      </div>
    </div>
  );
}
