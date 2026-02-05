"use client"

import { useState, useEffect } from "react";
import { clockIn, clockOut, getActiveSession } from "@/app/actions/kiosk";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Play, Square, Timer } from "lucide-react";

export function KioskActions({ userId, companyName }: { userId: string, companyName: string }) {
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check if the user is already clocked in
  useEffect(() => {
    const checkSession = async () => {
      const session = await getActiveSession(userId);
      setActiveSession(session);
      setLoading(false);
    };
    checkSession();
  }, [userId]);

  const handleClockIn = async () => {
    const result = await clockIn(userId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Shift started");
      setActiveSession(result.data);
    }
  };

  const handleClockOut = async () => {
    const result = await clockOut(activeSession.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Shift ended");
      setActiveSession(null);
      // Optional: Redirect back to user selection after a delay
      setTimeout(() => window.location.reload(), 2000);
    }
  };

  if (loading) return <div>Loading session...</div>;

  return (
    <div className="flex flex-col items-center justify-center space-y-8 h-full">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900">{companyName}</h2>
        <p className="text-slate-500">
          {activeSession ? "Currently Working" : "Ready to start shift"}
        </p>
      </div>

      {activeSession ? (
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-orange-100 text-orange-700 px-6 py-3 rounded-full flex items-center font-mono text-xl">
            <Timer className="mr-2" />
            Active since: {new Date(activeSession.clock_in).toLocaleTimeString()}
          </div>
          <Button 
            variant="destructive" 
            className="w-64 h-24 text-2xl font-bold" 
            onClick={handleClockOut}
          >
            <Square className="mr-2 fill-current" /> CLOCK OUT
          </Button>
        </div>
      ) : (
        <Button 
          className="bg-emerald-600 hover:bg-emerald-700 w-64 h-24 text-2xl font-bold" 
          onClick={handleClockIn}
        >
          <Play className="mr-2 fill-current" /> CLOCK IN
        </Button>
      )}
    </div>
  );
}