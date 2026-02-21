import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { UserSelection } from '@/components/kiosk/user-selection';
import { KioskActions } from '@/components/kiosk/kiosk-actions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Monitor, AlertTriangle } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function KioskPage({ searchParams }: { searchParams: Promise<{ tenantId?: string; name?: string }> }) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const isKioskDevice = cookieStore.get('kiosk_device')?.value === 'true';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    isAdmin = profile?.role === 'admin';
  }

  // Handle unauthorized devices
  if (!isKioskDevice && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-4 border border-slate-100">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Device Restricted</h1>
          <p className="text-slate-600">
            The timesheet system can only be accessed from the authorized tablet at the facility.
          </p>
          <div className="pt-6">
            <Link href="/">
              <Button variant="outline" className="w-full">Return Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Admin Setup Screen
  if (!isKioskDevice && isAdmin) {
    async function authorizeDevice() {
      "use server";
      const cookiesList = await cookies();
      cookiesList.set('kiosk_device', 'true', {
        path: '/',
        maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      redirect('/kiosk');
    }

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-4 border border-slate-100">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Monitor className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Kiosk Setup Menu</h1>
          <p className="text-slate-600">
            You are logged in as an admin. This device is not currently authorized as the Kiosk tablet.
          </p>
          <form action={authorizeDevice} className="pt-6 space-y-3">
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              Authorize This Device
            </Button>
            <Link href="/">
              <Button variant="ghost" className="w-full text-slate-500 hover:text-slate-700 mt-2">
                Cancel
              </Button>
            </Link>
          </form>
        </div>
      </div>
    );
  }

  // Show normal Kiosk if authorized
  if (!params.tenantId) {
    const { data: profiles } = await supabase.from('profiles').select('id, company_name').eq('role', 'tenant').eq('is_active', true);

    return (
      <div className="min-h-screen bg-slate-50 relative">
        {isAdmin && (
          <div className="absolute top-4 right-4 text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full shadow-sm">
            Device Authorized
          </div>
        )}
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