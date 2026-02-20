"use client"

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, Receipt, Monitor, Settings, LogOut, ChevronLeft, ChevronRight, Clock, PenTool as Tool } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

const navItems = [
  { name: "CALENDAR", href: "/calendar", icon: Calendar },
  { name: "Timesheets", href: "/timesheets", icon: Clock },
  { name: "My Billing", href: "/billing", icon: Receipt },
  { name: "Maintenance", href: "/maintenance", icon: Tool },
  { name: "Kiosk Mode", href: "/kiosk", icon: Monitor },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(pathname === "/calendar");

  // Effect to collapse when entering calendar
  useEffect(() => {
    if (pathname === "/calendar") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCollapsed(true);
    }
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
      toast.success("Signed out successfully");
    } catch {
      toast.error("Error signing out");
    }
  };

  return (
    <>
      {/* Mobile Toggle Button (Visible only when sidebar is collapsed on mobile) */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "fixed left-0 top-24 z-[100] md:hidden h-10 w-8 rounded-r-lg border border-l-0 border-slate-700 bg-slate-900 shadow-xl text-white hover:bg-slate-800 transition-transform duration-300",
          !isCollapsed && "-translate-x-full"
        )}
        onClick={() => setIsCollapsed(false)}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      <div
        className={cn(
          "flex h-full flex-col border-r bg-slate-50 p-4 transition-all duration-300 ease-in-out z-50",
          // Mobile: Fixed drawer
          "fixed inset-y-0 left-0 h-full md:relative md:block",
          isCollapsed ? "-translate-x-full w-0 md:translate-x-0 md:w-20" : "translate-x-0 w-64 shadow-2xl md:shadow-none"
        )}
      >
        {/* ... backdrop ... */}
        {!isCollapsed && (
          <div
            className="fixed inset-0 bg-black/50 z-[-1] md:hidden"
            onClick={() => setIsCollapsed(true)}
          />
        )}

        {/* ... header ... */}
        <div className={cn(
          "mb-8 flex transition-all duration-300",
          isCollapsed ? "flex-col items-center justify-center gap-4" : "flex-row items-center justify-between"
        )}>
          {/* ... logo ... */}
          <div className="flex items-center overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 shrink-0 flex items-center justify-center text-white font-bold">
              CB
            </div>
            {!isCollapsed && (
              <span className="ml-3 text-xl font-bold whitespace-nowrap overflow-hidden">Culinary Block</span>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full border border-slate-300 bg-white shadow-sm hover:bg-slate-100 flex shrink-0 text-slate-900"
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
                  "flex items-center rounded-md px-3 py-2 text-sm font-semibold cursor-pointer transition-colors",
                  isActive
                    ? "bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-700 hover:bg-slate-200",
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
              "w-full text-slate-700 hover:text-red-600",
              isCollapsed ? "justify-center px-0" : "justify-start"
            )}
            onClick={handleSignOut}
          >
            <LogOut className={cn("h-5 w-5 shrink-0", !isCollapsed && "mr-3")} />
            {!isCollapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </div>
    </>
  );
}