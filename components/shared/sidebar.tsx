"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Receipt, Monitor, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button"; // Ensure this path is correct

const navItems = [
  { name: "Schedule", href: "/calendar", icon: Calendar },
  { name: "My Billing", href: "/billing", icon: Receipt },
  { name: "Kiosk Info", href: "/kiosk-info", icon: Monitor },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-slate-50 p-4">
      <div className="mb-8 flex items-center px-2">
        <div className="h-8 w-8 rounded-lg bg-emerald-600 mr-3" />
        <span className="text-xl font-bold">Culinary Block</span>
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
                  : "text-slate-600 hover:bg-slate-200"
              )}>
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t pt-4">
        {/* If 'ghost' errors, try removing the variant prop to see if the red line moves */}
        <Button 
          variant="ghost" 
          className="w-full justify-start text-slate-600 hover:text-red-600"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}