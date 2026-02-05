import { createClient } from '@/utils/supabase/server';
import { UserSelection } from '@/components/kiosk/user-selection';

export default async function KioskPage() {
  const supabase = createClient();
  
  // Fetch active tenants for the kiosk selection list
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, company_name')
    .eq('role', 'tenant')
    .order('company_name');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row h-[600px]">
        {/* Left Side: Branding/Instructions */}
        <div className="md:w-1/3 bg-slate-900 p-8 text-white flex flex-col justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Culinary Block</h1>
            <p className="text-slate-400 text-sm">Station: Main Kitchen Terminal</p>
          </div>
          <div className="text-sm text-slate-500">
            Please select your company to begin.
          </div>
        </div>

        {/* Right Side: Interactive Selection */}
        <div className="md:w-2/3 p-8 overflow-y-auto">
          <UserSelection profiles={profiles || []} />
        </div>
      </div>
    </div>
  );
}