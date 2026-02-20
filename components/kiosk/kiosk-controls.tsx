"use client"

import { useState, useEffect } from "react";
// Import specific functions from the server actions file
import { getActiveSession, clockIn, clockOut } from "@/app/actions/kiosk";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Play, Square, Timer, Loader2 } from "lucide-react";

interface KioskControlsProps {
  userId: string;
  companyName: string;
}

export function KioskControls({ userId, companyName }: KioskControlsProps) {
  const [activeSession, setActiveSession] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function init() {
      const session = await getActiveSession(userId);
      setActiveSession(session);
      setLoading(false);
    }
    init();
  }, [userId]);

  const handleClockIn = async () => {
    const pin = window.prompt(`Enter PIN for ${companyName}:`);
    if (!pin) return;

    setIsProcessing(true);
    const result = await clockIn(userId, pin);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Shift started!");
      const newSession = await getActiveSession(userId);
      setActiveSession(newSession);
    }
    setIsProcessing(false);
  };

  const handleClockOut = async () => {
    if (!activeSession) return;

    setIsProcessing(true);
    const result = await clockOut(String(activeSession.id));

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Shift ended safely.");
      setActiveSession(null);
    }
    setIsProcessing(false);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12">
      <div className="text-center">
        <h2 className="text-4xl font-black text-slate-900 mb-2">{companyName}</h2>
        <p className="text-slate-500 font-medium tracking-wide uppercase text-sm">
          {activeSession ? "Shift in Progress" : "System Ready"}
        </p>
      </div>

      {activeSession ? (
        <div className="flex flex-col items-center space-y-6">
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-8 py-4 rounded-2xl flex items-center font-mono text-2xl shadow-sm">
            <Timer className="mr-3 h-6 w-6" />
            Active: {new Date(String(activeSession.clock_in)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <Button
            disabled={isProcessing}
            variant="destructive"
            className="w-72 h-28 text-3xl font-bold rounded-3xl shadow-xl hover:scale-105 transition-transform"
            onClick={handleClockOut}
          >
            {isProcessing ? <Loader2 className="animate-spin" /> : <><Square className="mr-3 fill-current h-8 w-8" /> STOP</>}
          </Button>
        </div>
      ) : (
        <Button
          disabled={isProcessing}
          className="bg-emerald-600 hover:bg-emerald-700 w-72 h-28 text-3xl font-bold rounded-3xl shadow-xl hover:scale-105 transition-transform"
          onClick={handleClockIn}
        >
          {isProcessing ? <Loader2 className="animate-spin" /> : <><Play className="mr-3 fill-current h-8 w-8" /> START</>}
        </Button>
      )}
    </div>
  );
}