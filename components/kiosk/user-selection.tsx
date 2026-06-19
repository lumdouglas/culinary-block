"use client"

import Link from 'next/link';

import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

interface UserSelectionProps {
  profiles: { id: string; company_name: string }[];
}

export function UserSelection({ profiles }: UserSelectionProps) {
  const router = useRouter();

  const tenantColumns =
    profiles.length > 40 ? 8 :
    profiles.length > 30 ? 7 :
    profiles.length > 20 ? 6 :
    profiles.length > 15 ? 5 :
    profiles.length > 10 ? 4 :
    profiles.length > 5 ? 3 : 2;

  const rowsCount = Math.max(1, Math.ceil(profiles.length / tenantColumns));

  return (
    <div className="h-full flex flex-col space-y-3 px-4 md:px-8">
      <div className="relative flex items-center justify-center">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 text-center">Select Your Company</h2>
        <button
          onClick={() => router.refresh()}
          className="absolute right-0 p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all"
          title="Refresh tenant list"
        >
          <RefreshCw className="h-5 w-5 md:h-6 md:w-6" />
        </button>
      </div>
      
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
            <span className="font-bold text-sm md:text-base lg:text-lg leading-tight text-slate-700 group-hover:text-emerald-700 line-clamp-2">
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