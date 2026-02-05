"use client"

import { useState } from "react";
import { verifyKioskPin } from "@/app/actions/kiosk";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Delete } from "lucide-react";

export function PinPad({ userId, onSucceed }: { userId: string, onSucceed: () => void }) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePress = (num: string) => {
    if (pin.length < 4) setPin(prev => prev + num);
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const result = await verifyKioskPin(pin, userId);
      if (result.success) {
        toast.success("Identity Verified");
        onSucceed();
      }
    } catch (err: any) {
      toast.error("Invalid PIN");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="flex space-x-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`w-4 h-4 rounded-full border-2 border-slate-300 ${pin.length > i ? 'bg-slate-900' : ''}`} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <Button key={n} variant="outline" className="h-16 w-16 text-xl" onClick={() => handlePress(n.toString())}>{n}</Button>
        ))}
        <Button variant="ghost" className="h-16 w-16" onClick={() => setPin("")}>Clear</Button>
        <Button variant="outline" className="h-16 w-16 text-xl" onClick={() => handlePress("0")}>0</Button>
        <Button variant="ghost" className="h-16 w-16" onClick={() => setPin(pin.slice(0, -1))}><Delete /></Button>
      </div>

      <Button className="w-full h-12 text-lg" disabled={pin.length < 4 || loading} onClick={handleVerify}>
        {loading ? <Loader2 className="animate-spin" /> : "Verify Identity"}
      </Button>
    </div>
  );
}