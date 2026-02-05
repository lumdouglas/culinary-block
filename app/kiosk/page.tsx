import { createClient } from '@/utils/supabase/server';
import { UserSelection } from '@/components/kiosk/user-selection';
import { KioskActions } from '@/components/kiosk/kiosk-actions';

export default async function KioskPage({ searchParams }: { searchParams: Promise<{ tenantId?: string; name?: string }> }) {
  const params = await searchParams;

  if (!params.tenantId) {
    const supabase = await createClient();
    const { data: profiles } = await supabase.from('profiles').select('id, company_name').eq('role', 'tenant');
    return <UserSelection profiles={profiles || []} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-12">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8">
        {/* HERE IS WHERE YOU PUT IT */}
        <KioskActions 
          userId={params.tenantId} 
          companyName={params.name || "Tenant"} 
        />
        
        <button 
          onClick={() => window.location.href = '/kiosk'}
          className="w-full text-center mt-8 text-slate-400 text-sm"
        >
          ← Cancel and go back
        </button>
      </div>
    </div>
  );
}