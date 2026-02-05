"use client"

import Link from 'next/link';

interface UserSelectionProps {
  profiles: { id: string; company_name: string }[];
}

export function UserSelection({ profiles }: UserSelectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Select Your Company</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* --- THIS IS THE MAP FUNCTION --- */}
        {profiles.map((profile) => (
          <Link 
            key={profile.id}
            // This URL tells the Kiosk Page which company was picked
            href={`/kiosk?tenantId=${profile.id}&name=${encodeURIComponent(profile.company_name)}`}
            className="p-8 text-center border-2 border-slate-100 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group bg-white shadow-sm"
          >
            <span className="font-bold text-lg text-slate-700 group-hover:text-emerald-700">
              {profile.company_name}
            </span>
          </Link>
        ))}
        {/* -------------------------------- */}
      </div>

      {profiles.length === 0 && (
        <div className="text-center py-20 text-slate-400 border-2 border-dashed rounded-2xl">
          No active tenants found in the system.
        </div>
      )}
    </div>
  );
}