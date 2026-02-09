"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Receipt, Monitor, Settings, LogOut, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navItems = [
  { name: "Schedule", href: "/calendar", icon: Calendar },
  { name: "Timesheets", href: "/timesheets", icon: Clock },
  { name: "My Billing", href: "/billing", icon: Receipt },
  { name: "Kiosk Mode", href: "/kiosk", icon: Monitor },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-slate-50 p-4 transition-all duration-300 ease-in-out z-50",
        // Mobile: Fixed drawer
        "fixed inset-y-0 left-0 h-full md:relative",
        isCollapsed ? "-translate-x-full w-0 md:translate-x-0 md:w-20" : "translate-x-0 w-64 shadow-2xl md:shadow-none"
      )}
    >
      {/* Mobile Backdrop */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-[-1] md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      {/* Toggle Button */}
      <div className={cn(
        "mb-8 flex transition-all duration-300",
        isCollapsed ? "flex-col items-center justify-center gap-4" : "flex-row items-center justify-between"
      )}>
        <div className="flex items-center overflow-hidden">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 shrink-0 flex items-center justify-center text-white font-bold">
            CB
          </div>
          {!isCollapsed && (
            <span className="ml-3 text-xl font-bold whitespace-nowrap overflow-hidden">Culinary Block</span>
          )}
        </div>

        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full border bg-white shadow-sm hover:bg-slate-100 flex shrink-0"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <span className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium cursor-pointer transition-colors",
                isActive
                  ? "bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:bg-slate-200",
                isCollapsed && "justify-center px-2"
              )}>
                <Icon className={cn("h-5 w-5 shrink-0", !isCollapsed && "mr-3")} />
                {!isCollapsed && (
                  <span className="whitespace-nowrap overflow-hidden">{item.name}</span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t pt-4">
        <Button
          variant="ghost"
          className={cn(
            "w-full text-slate-600 hover:text-red-600",
            isCollapsed ? "justify-center px-0" : "justify-start"
          )}
        >
          <LogOut className={cn("h-5 w-5 shrink-0", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </div>
  );
}