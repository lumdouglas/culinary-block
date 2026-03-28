"use client"

import Link from 'next/link';

interface UserSelectionProps {
  profiles: { id: string; company_name: string }[];
}

export function UserSelection({ profiles }: UserSelectionProps) {
  const tenantColumns = 2;

  const rowsCount = Math.max(1, Math.ceil(profiles.length / tenantColumns));

  return (
    <div className="h-full flex flex-col space-y-3 px-4 md:px-8">
      <h2 className="text-xl md:text-2xl font-bold text-slate-800 text-center">Select Your Company</h2>
      
      <div
        className="grid flex-1 min-h-0 gap-2 md:gap-3"
        style={{ 
          gridTemplateColumns: `repeat(${tenantColumns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rowsCount}, minmax(0, 1fr))`
        }}
      >
        {/* --- THIS IS THE MAP FUNCTION --- */}
        {profiles.map((profile) => (
          <Link 
            key={profile.id}
            href={`/kiosk?tenantId=${profile.id}&name=${encodeURIComponent(profile.company_name)}`}
            className="h-full px-1 py-1 md:px-2 md:py-2 text-center border-2 border-slate-100 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group bg-white shadow-sm flex items-center justify-center overflow-hidden"
            data-testid={`tenant-card-${profile.id}`}
          >
            <span className="font-bold text-xl md:text-2xl lg:text-3xl leading-tight text-slate-700 group-hover:text-emerald-700 break-words">
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