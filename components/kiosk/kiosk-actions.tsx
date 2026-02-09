"use client"

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Play, Square, Timer, Loader2, CheckCircle, Clock } from "lucide-react";

// Local API wrappers
async function clockIn(userId: string, pin: string) {
  try {
    const res = await fetch("/api/kiosk/clock-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, pin }),
    });
    const payload = await res.json();
    if (!res.ok) return { error: payload?.error || "Failed to clock in" };
    return { data: payload };
  } catch (err) {
    return { error: (err as Error).message || "Network error" };
  }
}

async function clockOut(sessionId: string, userId: string, pin: string) {
  try {
    const res = await fetch("/api/kiosk/clock-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, userId, pin }),
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

// Format duration from milliseconds to human-readable string
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
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [countdown, setCountdown] = useState(10);
  const [sessionDuration, setSessionDuration] = useState<string>("");
  const [successTime, setSuccessTime] = useState<string | null>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Check if the user is already clocked in
  useEffect(() => {
    const checkSession = async () => {
      const session = await getActiveSession(userId);
      setActiveSession(session);
      setLoading(false);
    };
    checkSession();
  }, [userId]);

  // Auto-focus PIN input when in idle state
  useEffect(() => {
    if (!loading && screenState === 'idle' && pinInputRef.current) {
      pinInputRef.current.focus();
    }
  }, [loading, screenState]);

  // Countdown timer for auto-redirect
  useEffect(() => {
    if (screenState === 'idle') return;

    if (countdown <= 0) {
      // Redirect back to main kiosk page
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
      pinInputRef.current?.focus();
    }, 100);

    setTimeout(() => {
      setShake(false);
      setPinError(false);
    }, 600);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
    if (pinError) setPinError(false);
  };

  const handleClockIn = async () => {
    if (!pin || pin.length !== 4) {
      toast.error("Please enter your 4-digit PIN");
      return;
    }

    setIsProcessing(true);
    const result = await clockIn(userId, pin);
    if (result.error) {
      toast.error("Wrong PIN", { description: "Please try again" });
      triggerErrorAnimation();
    } else {
      const time = new Date().toISOString();
      setSuccessTime(time);
      setActiveSession(result.data); // Optimistic update or use returned data
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

    setIsProcessing(true);
    const result = await clockOut(activeSession.id, userId, pin);
    if (result.error) {
      toast.error("Wrong PIN", { description: "Please try again" });
      triggerErrorAnimation();
    } else {
      // Calculate session duration
      const clockInTime = new Date(activeSession.clock_in).getTime();
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pin.length === 4) {
      if (activeSession) {
        handleClockOut();
      } else {
        handleClockIn();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin h-8 w-8 text-slate-400" />
      </div>
    );
  }

  // Success screen after clocking IN
  if (screenState === 'clocked-in') {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 h-full text-center">
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

  // Summary screen after clocking OUT
  if (screenState === 'clocked-out') {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 h-full text-center">
        <div className="bg-blue-100 rounded-full p-6">
          <Clock className="h-20 w-20 text-blue-600" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-900">{companyName}</h2>
          <p className="text-xl text-blue-600 font-semibold mt-2">Shift Completed!</p>
          <div className="mt-4 bg-slate-100 rounded-xl px-8 py-4">
            <p className="text-slate-500 text-sm">Session Duration</p>
            <p className="text-3xl font-bold text-slate-900">{sessionDuration}</p>
          </div>
        </div>
        <div className="text-slate-400 text-sm">
          Returning to main screen in {countdown} seconds...
        </div>
      </div>
    );
  }

  // CSS for shake animation
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

        {activeSession ? (
          <div className="flex flex-col items-center space-y-6 w-full">
            <div className="bg-orange-100 text-orange-700 px-6 py-3 rounded-full flex items-center font-mono text-xl">
              <Timer className="mr-2" />
              Active since: {new Date(activeSession.clock_in).toLocaleTimeString()}
            </div>

            <div className="w-full max-w-xs space-y-2">
              <label htmlFor="pin" className="block text-sm font-medium text-slate-600 text-center">
                Enter your 4-digit PIN
              </label>
              <Input
                ref={pinInputRef}
                id="pin"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={handlePinChange}
                onKeyDown={handleKeyDown}
                className={`text-center text-3xl tracking-[0.5em] h-16 font-mono transition-colors duration-200 ${pinError ? 'border-red-500 ring-2 ring-red-200 focus-visible:ring-red-300' : ''
                  }`}
                autoComplete="off"
                autoFocus
              />
            </div>

            <Button
              variant="destructive"
              className="w-full max-w-xs h-20 text-2xl font-bold"
              onClick={handleClockOut}
              disabled={isProcessing || pin.length !== 4}
              style={shakeStyle}
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Square className="mr-2 fill-current" /> CLOCK OUT
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-6 w-full">
            <div className="w-full max-w-xs space-y-2">
              <label htmlFor="pin" className="block text-sm font-medium text-slate-600 text-center">
                Enter your 4-digit PIN
              </label>
              <Input
                ref={pinInputRef}
                id="pin"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={handlePinChange}
                onKeyDown={handleKeyDown}
                className={`text-center text-3xl tracking-[0.5em] h-16 font-mono transition-colors duration-200 ${pinError ? 'border-red-500 ring-2 ring-red-200 focus-visible:ring-red-300' : ''
                  }`}
                autoComplete="off"
                autoFocus
              />
            </div>

            <Button
              className="bg-emerald-600 hover:bg-emerald-700 w-full max-w-xs h-20 text-2xl font-bold"
              onClick={handleClockIn}
              disabled={isProcessing || pin.length !== 4}
              style={shakeStyle}
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Play className="mr-2 fill-current" /> CLOCK IN
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}