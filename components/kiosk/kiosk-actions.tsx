"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Play, Square, Timer, Loader2, CheckCircle, Clock } from "lucide-react";
import { PinPad } from "@/components/kiosk/pin-pad";

async function clockIn(userId: string, pin: string, companyName: string) {
  try {
    const res = await fetch("/api/kiosk/clock-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, pin, companyName }),
    });
    const payload = await res.json();
    if (!res.ok) return { error: payload?.error || "Failed to clock in" };
    return { data: payload };
  } catch (err) {
    return { error: (err as Error).message || "Network error" };
  }
}

async function clockOut(sessionId: string, userId: string, pin: string, companyName: string) {
  try {
    const res = await fetch("/api/kiosk/clock-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, userId, pin, companyName }),
    });
    const payload = await res.json();
    if (!res.ok) return { error: payload?.error || "Failed to clock out" };
    return { data: payload };
  } catch (err) {
    return { error: (err as Error).message || "Network error" };
  }
}

async function getActiveSession(userId: string) {
  try {
    const res = await fetch(`/api/kiosk/active-session?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return null;
    const payload = await res.json();
    return payload?.session ?? null;
  } catch {
    return null;
  }
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

type ScreenState = 'idle' | 'clocked-in' | 'clocked-out';

export function KioskActions({ userId, companyName }: { userId: string, companyName: string }) {
  const [activeSession, setActiveSession] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [countdown, setCountdown] = useState(10);
  const [sessionDuration, setSessionDuration] = useState<string>("");
  const [successTime, setSuccessTime] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const session = await getActiveSession(userId);
      setActiveSession(session);
      setLoading(false);
    };
    checkSession();
  }, [userId]);

  useEffect(() => {
    if (screenState === 'idle') return;

    if (countdown <= 0) {
      window.location.href = '/kiosk';
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, screenState]);

  const triggerErrorAnimation = () => {
    setShake(true);
    setPinError(true);
    setPin("");

    setTimeout(() => {
      setShake(false);
      setPinError(false);
    }, 600);
  };

  const handleClockIn = async () => {
    if (!pin || pin.length !== 4) {
      toast.error("Please enter your 4-digit PIN");
      return;
    }

    setIsProcessing(true);
    const result = await clockIn(userId, pin, companyName);
    if (result.error) {
      toast.error("Wrong PIN", { description: "Please try again" });
      triggerErrorAnimation();
    } else {
      const time = new Date().toISOString();
      setSuccessTime(time);
      setActiveSession(result.data);
      setPin("");
      setCountdown(10);
      setScreenState('clocked-in');
    }
    setIsProcessing(false);
  };

  const handleClockOut = async () => {
    if (!pin || pin.length !== 4) {
      toast.error("Please enter your 4-digit PIN to clock out");
      return;
    }

    if (!activeSession) return;

    setIsProcessing(true);
    const result = await clockOut(String(activeSession.id), userId, pin, companyName);
    if (result.error) {
      toast.error("Wrong PIN", { description: "Please try again" });
      triggerErrorAnimation();
    } else {
      const clockInTime = new Date(String(activeSession.clock_in)).getTime();
      const clockOutTime = Date.now();
      const duration = clockOutTime - clockInTime;
      setSessionDuration(formatDuration(duration));

      setActiveSession(null);
      setPin("");
      setCountdown(10);
      setScreenState('clocked-out');
    }
    setIsProcessing(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin h-8 w-8 text-slate-400" />
      </div>
    );
  }

  if (screenState === 'clocked-in') {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 h-full text-center" data-testid="clock-in-success">
        <div className="bg-emerald-100 rounded-full p-6">
          <CheckCircle className="h-20 w-20 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-900">{companyName}</h2>
          <p className="text-xl text-emerald-600 font-semibold mt-2">Shift Started!</p>
          <p className="text-slate-500 mt-1">
            You are now clocked in at {successTime ? new Date(successTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}.
          </p>
        </div>
        <div className="text-slate-400 text-sm">
          Returning to main screen in {countdown} seconds...
        </div>
      </div>
    );
  }

  if (screenState === 'clocked-out') {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 h-full text-center" data-testid="clock-out-success">
        <div className="bg-blue-100 rounded-full p-6">
          <Clock className="h-20 w-20 text-blue-600" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-900">{companyName}</h2>
          <p className="text-xl text-blue-600 font-semibold mt-2">Shift Completed!</p>
          <div className="mt-4 bg-slate-100 rounded-xl px-8 py-4">
            <p className="text-slate-500 text-sm">Session Duration</p>
            <p className="text-3xl font-bold text-slate-900" data-testid="session-duration">{sessionDuration}</p>
          </div>
        </div>
        <div className="text-slate-400 text-sm">
          Returning to main screen in {countdown} seconds...
        </div>
      </div>
    );
  }

  const shakeStyle = shake ? {
    animation: 'shake 0.5s ease-in-out'
  } : {};

  return (
    <>
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
      `}</style>

      <div className="flex flex-col items-center justify-center space-y-8 h-full">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">{companyName}</h2>
          <p className="text-slate-500">
            {activeSession ? "Currently Working" : "Ready to start shift"}
          </p>
        </div>

        {activeSession && (
          <div className="bg-orange-100 text-orange-700 px-6 py-3 rounded-full flex items-center font-mono text-xl" data-testid="active-session-badge">
            <Timer className="mr-2" />
            Active since: {activeSession.clock_in ? new Date(String(activeSession.clock_in)).toLocaleTimeString() : ''}
          </div>
        )}

        <div className="flex flex-col items-center space-y-2">
          <label className="block text-sm font-medium text-slate-600 text-center">
            Enter your 4-digit PIN
          </label>
          <div style={shakeStyle}>
            <PinPad
              value={pin}
              onChange={(newPin) => {
                setPin(newPin);
                if (pinError) setPinError(false);
              }}
              error={pinError}
            />
          </div>
        </div>

        {activeSession ? (
          <Button
            variant="destructive"
            className="w-full max-w-xs h-20 text-2xl font-bold"
            onClick={handleClockOut}
            disabled={isProcessing || pin.length !== 4}
            data-testid="clock-out-button"
          >
            {isProcessing ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Square className="mr-2 fill-current" /> CLOCK OUT
              </>
            )}
          </Button>
        ) : (
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 w-full max-w-xs h-20 text-2xl font-bold"
            onClick={handleClockIn}
            disabled={isProcessing || pin.length !== 4}
            data-testid="clock-in-button"
          >
            {isProcessing ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Play className="mr-2 fill-current" /> CLOCK IN
              </>
            )}
          </Button>
        )}
      </div>
    </>
  );
}
