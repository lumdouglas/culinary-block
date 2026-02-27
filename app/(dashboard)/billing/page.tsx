import { createClient } from '@/utils/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Local algorithm to handle your specific 50/40/30 pricing tiers
function calculateTieredCost(totalHours: number): number {
  let cost = 0;
  let remainingHours = totalHours;

  // Tier 1: First 20 hours at $50/hr
  const tier1Hours = Math.min(remainingHours, 20);
  cost += tier1Hours * 50;
  remainingHours -= tier1Hours;

  if (remainingHours <= 0) return cost;

  // Tier 2: Hours 21-100 at $40/hr
  const tier2Hours = Math.min(remainingHours, 80); // 80 hours total in this bucket
  cost += tier2Hours * 40;
  remainingHours -= tier2Hours;

  if (remainingHours <= 0) return cost;

  // Tier 3: Everything over 100 at $30/hr
  cost += remainingHours * 30;

  return cost;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'in_progress') {
    return <Badge variant="outline" className="border-blue-400 text-blue-700 bg-blue-50">In Progress</Badge>;
  }
  if (status === 'pending') {
    return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>;
  }
  if (status === 'invoiced') {
    return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Invoiced</Badge>;
  }
  return <Badge variant="outline">{status}</Badge>;
}

export default async function BillingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>Please log in to view billing.</div>;

  // Fetch usage and kitchen details from TIMESHEETS (actual usage)
  const { data: timesheets } = await supabase
    .from('timesheets')
    .select(`
      id,
      clock_in,
      clock_out,
      duration_minutes,
      status,
      kitchens(name)
    `)
    .eq('user_id', user.id)
    .order('clock_in', { ascending: false });

  const records = timesheets || [];

  // Calculate cumulative stats for the current month (PST)
  const nowPST = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
  const currentMonthKey = new Date(nowPST).toISOString().slice(0, 7); // YYYY-MM

  let totalMinutes = 0;

  // Helper to get PST Date object
  const getPSTDate = (dateStr: string) => {
    const pstStr = new Date(dateStr).toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
    return new Date(pstStr);
  };

  // Group records by month for history
  const history = records.reduce((acc: any, record: any) => {
    if (!record.clock_in) return acc;

    const pstDate = getPSTDate(record.clock_in);
    const key = `${pstDate.getFullYear()}-${String(pstDate.getMonth() + 1).padStart(2, '0')}`;

    if (!acc[key]) {
      acc[key] = {
        month: key,
        date: pstDate,
        totalMinutes: 0,
        recordCount: 0
      };
    }

    if (record.duration_minutes) {
      acc[key].totalMinutes += record.duration_minutes;

      if (key === currentMonthKey) {
        totalMinutes += record.duration_minutes;
      }
    }
    acc[key].recordCount++;

    return acc;
  }, {});

  const totalHours = totalMinutes / 60;
  const currentMonthCost = calculateTieredCost(totalHours);

  const historyList = Object.values(history || {}).sort((a: any, b: any) => b.month.localeCompare(a.month));

  // Fetch billing period statuses for this tenant
  const { data: billingPeriods } = await supabase
    .from('billing_periods')
    .select('period_month, status')
    .eq('tenant_id', user.id);

  const billingStatusMap: Record<string, string> = {};
  (billingPeriods || []).forEach((bp: any) => {
    billingStatusMap[bp.period_month] = bp.status;
  });

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing &amp; Usage</h1>
        <p className="text-slate-500">Your rates adjust automatically as you use more hours.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-900 text-sm font-medium">Current Month Usage (PST)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">{totalHours.toFixed(1)} hrs</div>
            <p className="text-xs text-emerald-600 mt-1">
              Current Tier: {totalHours <= 20 ? "$50/hr" : totalHours <= 100 ? "$40/hr" : "$30/hr"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 text-white border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-400 text-sm font-medium">Estimated Balance (Current Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${currentMonthCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-slate-400 mt-1">Next rate drop at {totalHours <= 20 ? "20" : "100"} hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Billing History */}
      <div>
        <h2 className="text-xl font-bold mb-4">Billing History</h2>
        <div className="rounded-md border bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-100 border-b border-slate-300">
              <TableRow className="border-slate-300 hover:bg-transparent">
                <TableHead className="text-slate-900 font-bold">Month</TableHead>
                <TableHead className="text-slate-900 font-bold">Total Hours</TableHead>
                <TableHead className="text-slate-900 font-bold">Bookings</TableHead>
                <TableHead className="text-slate-900 font-bold">Estimated Cost</TableHead>
                <TableHead className="text-slate-900 font-bold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyList.map((period: any) => {
                const hours = period.totalMinutes / 60;
                const cost = calculateTieredCost(hours);
                const monthName = period.date.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', month: 'long', year: 'numeric' });
                const isCurrentMonth = period.month === currentMonthKey;

                // Determine status: check billing_periods table first,
                // then fall back to defaults based on whether month is current or past.
                let status = billingStatusMap[period.month];
                if (!status) {
                  status = isCurrentMonth ? 'in_progress' : 'pending';
                }

                return (
                  <TableRow key={period.month} className="border-b border-slate-200">
                    <TableCell className="font-medium text-slate-900">{monthName}</TableCell>
                    <TableCell className="text-slate-900">{hours.toFixed(1)} hrs</TableCell>
                    <TableCell className="text-slate-900">{period.recordCount}</TableCell>
                    <TableCell className="text-slate-900">${cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <StatusBadge status={status} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {historyList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-slate-500">No billing history found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Invoices are sent via QuickBooks at the end of each billing period.
        </p>
      </div>

      {/* Usage Table */}
      <div>
        <h2 className="text-xl font-bold mb-4">Recent Usage Details</h2>
        <div className="rounded-md border bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 [&_th]:text-slate-700">
              <TableRow>
                <TableHead>Date (PST)</TableHead>
                <TableHead>Kitchen</TableHead>
                <TableHead>Time Range (PST)</TableHead>
                <TableHead>Actual Duration</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records?.slice(0, 50).map((record: any) => {
                const datePST = new Date(record.clock_in).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" });

                const startPST = new Date(record.clock_in).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: '2-digit', minute: '2-digit' });
                const endPST = record.clock_out
                  ? new Date(record.clock_out).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: '2-digit', minute: '2-digit' })
                  : "Active";

                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium text-slate-900">{datePST}</TableCell>
                    <TableCell className="text-slate-900">{record.kitchens?.name || 'Unknown'}</TableCell>
                    <TableCell className="text-slate-700">{startPST} - {endPST}</TableCell>
                    <TableCell className="font-bold text-slate-900">
                      {record.duration_minutes
                        ? `${(record.duration_minutes / 60).toFixed(1)} hrs`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {!record.clock_out ? (
                        <Badge variant="default">In Progress</Badge>
                      ) : record.status === 'pending' ? (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Verified</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!records || records.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-slate-500">No recent usage found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}