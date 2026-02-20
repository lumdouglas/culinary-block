import { createClient } from '@/utils/supabase/server';
import { UserSelection } from '@/components/kiosk/user-selection';
import { KioskActions } from '@/components/kiosk/kiosk-actions';
import Link from 'next/link';

export default async function KioskPage({ searchParams }: { searchParams: Promise<{ tenantId?: string; name?: string }> }) {
  const params = await searchParams;

  if (!params.tenantId) {
    const supabase = await createClient();
    const { data: profiles } = await supabase.from('profiles').select('id, company_name').eq('role', 'tenant').eq('is_active', true);

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="py-12">
          <UserSelection profiles={profiles || []} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-12">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8">
          <KioskActions
            userId={params.tenantId}
            companyName={params.name || "Tenant"}
          />

          <Link
            href="/kiosk"
            className="block w-full text-center mt-8 text-slate-400 text-sm hover:text-slate-600 transition-colors"
          >
            ← Cancel and go back
          </Link>
        </div>
      </div>
    </div>
  );
}