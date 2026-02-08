"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Receipt, Monitor, Settings, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navItems = [
  { name: "Schedule", href: "/calendar", icon: Calendar },
  { name: "My Billing", href: "/billing", icon: Receipt },
  { name: "Kiosk Info", href: "/kiosk-info", icon: Monitor },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-slate-50 p-4 transition-all duration-300 ease-in-out relative",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-6 h-6 w-6 rounded-full border bg-white shadow-md z-10 hover:bg-slate-100 hidden md:flex"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      <div className={cn(
        "mb-8 flex items-center px-2",
        isCollapsed ? "justify-center" : ""
      )}>
        <div className="h-8 w-8 rounded-lg bg-emerald-600 shrink-0 flex items-center justify-center text-white font-bold">
          CB
        </div>
        {!isCollapsed && (
          <span className="ml-3 text-xl font-bold whitespace-nowrap overflow-hidden">Culinary Block</span>
        )}
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