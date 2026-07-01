'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Home, Bell, User, LogOut, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import GlobalSearch from './GlobalSearch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function Header() {
  const router = useRouter();
  const { currentUser, currentRole, notifications, logout } = useAuthStore();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 flex items-center h-14 px-3 md:px-5 bg-white/90 backdrop-blur-md border-b border-slate-200/60 shrink-0 gap-2 shadow-sm">

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700 flex-shrink-0"
        title="Go back"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Home button */}
      <Link
        href="/dashboard"
        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700 flex-shrink-0"
        title="Dashboard"
      >
        <Home className="w-4 h-4" />
      </Link>

      {/* Global Search */}
      <div className="flex-1 min-w-0 mx-2">
        <GlobalSearch />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1 flex-shrink-0">

        {/* Notifications */}
        <Link
          href="/notifications"
          className="relative p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
          title="Notifications"
        >
          <Bell className={cn("w-4 h-4", unreadCount > 0 && "text-blue-600")} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-rose-500 text-white text-[8px] font-extrabold rounded-full flex items-center justify-center px-0.5 border border-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User menu — BaseUI DropdownMenu does not support asChild, so we pass the trigger content directly */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors ml-1 outline-none focus:ring-0">
            <Avatar className="w-7 h-7 rounded-lg border border-slate-200">
              {currentUser?.photo
                ? <AvatarImage src={currentUser.photo} className="object-cover rounded-lg" />
                : null}
              <AvatarFallback className="rounded-lg bg-blue-100 text-blue-700 font-bold text-xs">
                {currentUser?.name?.charAt(0) ?? 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight max-w-[100px] truncate">
                {currentUser?.name ?? 'Admin'}
              </div>
              <div className="text-[9px] text-slate-400 font-medium leading-tight truncate">
                {currentRole}
              </div>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="text-xs font-bold text-slate-800">{currentUser?.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{currentUser?.email}</div>
                <div className="text-[9px] text-blue-600 font-bold mt-0.5">{currentRole}</div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <User className="w-3.5 h-3.5 mr-2 text-slate-400" />
              <span className="text-xs font-semibold">My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/notifications')}>
              <Bell className="w-3.5 h-3.5 mr-2 text-slate-400" />
              <span className="text-xs font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="w-3.5 h-3.5 mr-2 text-slate-400" />
              <span className="text-xs font-semibold">Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { logout(); router.push('/login'); }} variant="destructive">
              <LogOut className="w-3.5 h-3.5 mr-2" />
              <span className="text-xs font-semibold">Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
