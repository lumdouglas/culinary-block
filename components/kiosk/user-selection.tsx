"use client"

import { Button } from "@/components/ui/button"

interface UserSelectionProps {
  profiles: { id: string; company_name: string }[];
}

export function UserSelection({ profiles }: UserSelectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-800 mb-6">Select Your Company</h2>
      <div className="grid grid-cols-1 gap-3">
        {profiles.length > 0 ? (
          profiles.map((profile) => (
            <Button
              key={profile.id}
              variant="outline"
              className="h-20 text-lg justify-start px-8 hover:border-emerald-500 hover:bg-emerald-50 transition-all"
              onClick={() => console.log("Selected:", profile.company_name)}
            >
              {profile.company_name}
            </Button>
          ))
        ) : (
          <div className="text-center py-10 text-slate-400">
            No active tenants found.
          </div>
        )}
      </div>
    </div>
  );
}