'use client';
 
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Users, Briefcase, Clock, ClipboardList, DollarSign,
    Calendar, Car, FileText, Settings, ShieldCheck, FileCheck, Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
 
const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Applicants', href: '/applicants', icon: Users, module: 'applicants' },
    { name: 'Placement Agreements', href: '/placement', icon: FileCheck, module: 'placement' },
    { name: 'Staff Management', href: '/staff', icon: Briefcase, module: 'staff' },
    { name: 'Shift Management', href: '/shifts', icon: Clock, module: 'staff' },
    { name: 'Attendance', href: '/attendance', icon: ClipboardList, module: 'attendance' },
    { name: 'Payroll', href: '/payroll', icon: DollarSign, module: 'payroll' },
    { name: 'Interviews', href: '/interviews', icon: Calendar, module: 'interviews' },
    { name: 'Vehicles', href: '/vehicles', icon: Car, module: 'vehicles' },
    { name: 'Documents', href: '/documents', icon: FileText, module: 'documents' },
    { name: 'Email Center', href: '/emails', icon: Mail, module: 'emails' },
    { name: 'Roles & Permissions', href: '/settings/roles', icon: ShieldCheck, module: 'roles' },
    { name: 'Site Settings', href: '/settings/site', icon: Settings, module: 'settings' },
];
 
export function Sidebar() {
    const pathname = usePathname();
    const { currentUser, currentRole, hasPermission } = useAuthStore();
 
    const visibleNavigation = navigation.filter(item => {
        if (!item.module) return true; // always show Dashboard
        return hasPermission(item.module, "view");
    });
 
    return (
        <div className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 ms-sidebar-gradient border-r border-white/5 shadow-2xl">
            <div className="flex items-center h-20 px-8 shrink-0">
                <Link href="/dashboard" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                        <span className="text-white font-black text-xl">MS</span>
                    </div>
                    <span className="text-white font-bold text-lg tracking-tight">Management</span>
                </Link>
            </div>
 
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto ms-stagger min-h-0">
                {visibleNavigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                                isActive
                                    ? "ms-sidebar-link-active"
                                    : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon className={cn(
                                "mr-4 h-5 w-5 shrink-0 transition-colors",
                                isActive ? "text-white" : "text-sidebar-foreground/40 group-hover:text-white"
                            )} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
 
            <div className="p-4 mt-auto">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 ms-animate-in">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 border-2 border-white/20 flex items-center justify-center text-white font-extrabold text-xs uppercase flex-shrink-0">
                            {currentUser?.name?.slice(0, 2) || "US"}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-xs font-bold text-white truncate">{currentUser?.name || "User"}</p>
                            <p className="text-[10px] text-white/50 truncate mb-1">{currentUser?.email || ""}</p>
                            <span className="inline-flex text-[9px] font-extrabold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 uppercase tracking-wider">{currentRole || "Staff"}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}