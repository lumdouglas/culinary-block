"use client"

import { Button } from "@/components/ui/button";
import { Delete } from "lucide-react";

interface PinPadProps {
  value: string;
  onChange: (pin: string) => void;
  onSubmit?: () => void;
  error?: boolean;
}

export function PinPad({ value, onChange, onSubmit, error }: PinPadProps) {
  const handlePress = (num: string) => {
    if (value.length < 4) {
      const next = value + num;
      onChange(next);
      if (next.length === 4 && onSubmit) {
        setTimeout(onSubmit, 150);
      }
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="flex space-x-4" data-testid="pin-dots">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`w-5 h-5 rounded-full border-2 transition-colors duration-150 ${
              error
                ? 'border-red-400 bg-red-400'
                : value.length > i
                  ? 'border-slate-900 bg-slate-900'
                  : 'border-slate-300'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <Button
            key={n}
            variant="outline"
            className="h-18 w-18 text-2xl font-semibold"
            onClick={() => handlePress(n.toString())}
            data-testid={`pin-key-${n}`}
          >
            {n}
          </Button>
        ))}
        <Button
          variant="ghost"
          className="h-18 w-18 text-sm font-medium text-slate-500"
          onClick={() => onChange("")}
          data-testid="pin-key-clear"
        >
          Clear
        </Button>
        <Button
          variant="outline"
          className="h-18 w-18 text-2xl font-semibold"
          onClick={() => handlePress("0")}
          data-testid="pin-key-0"
        >
          0
        </Button>
        <Button
          variant="ghost"
          className="h-18 w-18 text-slate-500"
          onClick={() => onChange(value.slice(0, -1))}
          data-testid="pin-key-delete"
        >
          <Delete className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
