import { createClient } from '@/utils/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { startOfMonth, endOfMonth, addMonths, subMonths, format, isSameMonth } from "date-fns";

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

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>Please log in to view billing.</div>;

  const { month } = await searchParams;

  // Determine viewed month
  const currentDate = new Date();
  const viewDate = month ? new Date(`${month}-01T00:00:00`) : currentDate;
  const isCurrentMonth = isSameMonth(viewDate, currentDate);
  const prevMonthStr = format(subMonths(viewDate, 1), 'yyyy-MM');
  const nextMonthStr = format(addMonths(viewDate, 1), 'yyyy-MM');
  const viewMonthStr = format(viewDate, 'yyyy-MM');
  const currentMonthStr = format(currentDate, 'yyyy-MM');
  const viewMonthStart = startOfMonth(viewDate).toISOString();
  const viewMonthEnd = endOfMonth(viewDate).toISOString();

  // Helper to get PST-local date string
  const getPSTDate = (dateStr: string) => {
    const pstStr = new Date(dateStr).toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
    return new Date(pstStr);
  };

  // Fetch ALL timesheets to build monthly history
  const { data: allTimesheets } = await supabase
    .from('timesheets')
    .select('id, clock_in, clock_out, duration_minutes, status, kitchens(name)')
    .eq('user_id', user.id)
    .order('clock_in', { ascending: false });

  const allRecords = allTimesheets || [];

  // Build monthly summary map
  const history = allRecords.reduce((acc: any, record: any) => {
    if (!record.clock_in) return acc;
    const pstDate = getPSTDate(record.clock_in);
    const key = `${pstDate.getFullYear()}-${String(pstDate.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[key]) {
      acc[key] = { month: key, date: pstDate, totalMinutes: 0, recordCount: 0 };
    }
    if (record.duration_minutes) {
      acc[key].totalMinutes += record.duration_minutes;
    }
    acc[key].recordCount++;
    return acc;
  }, {});

  const historyList: any[] = Object.values(history).sort((a: any, b: any) => b.month.localeCompare(a.month));

  // Records for the viewed month (filter from allRecords)
  const viewedMonthRecords = allRecords.filter((record: any) => {
    if (!record.clock_in) return false;
    const pstDate = getPSTDate(record.clock_in);
    const key = `${pstDate.getFullYear()}-${String(pstDate.getMonth() + 1).padStart(2, '0')}`;
    return key === viewMonthStr;
  });

  // Stats for the viewed month
  const viewedMonthMinutes = viewedMonthRecords.reduce((acc: number, r: any) => acc + (r.duration_minutes || 0), 0);
  const viewedMonthHours = viewedMonthMinutes / 60;
  const viewedMonthCost = calculateTieredCost(viewedMonthHours);

  // Fetch billing period statuses
  const { data: billingPeriods } = await supabase
    .from('billing_periods')
    .select('period_month, status')
    .eq('tenant_id', user.id);

  const billingStatusMap: Record<string, string> = {};
  (billingPeriods || []).forEach((bp: any) => {
    billingStatusMap[bp.period_month] = bp.status;
  });

  const viewedPeriodStatus = billingStatusMap[viewMonthStr] || (isCurrentMonth ? 'in_progress' : 'pending');

  return (
    <div className="flex-1 p-8 pt-6 max-w-7xl mx-auto space-y-8">

      {/* Header + month navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Usage</h1>
          <p className="text-slate-500 mt-1">
            Viewing {format(viewDate, 'MMMM yyyy')} — rates adjust as you use more hours.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <Link href={`?month=${prevMonthStr}`}>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div className="text-sm font-medium px-3 text-center min-w-[140px]">
            <div className="text-slate-400 text-xs uppercase tracking-wide leading-tight">
              {format(viewDate, 'MMMM yyyy')}
            </div>
            <div className="text-slate-900 font-bold">
              {viewedMonthHours.toFixed(1)} hrs
            </div>
          </div>

          {isCurrentMonth ? (
            <Button variant="outline" size="icon" className="h-8 w-8" disabled>
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Link href={`?month=${nextMonthStr}`}>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Summary cards for viewed month */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-900 text-sm font-medium">
              {isCurrentMonth ? 'Current Month Usage' : format(viewDate, 'MMMM yyyy') + ' Usage'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">{viewedMonthHours.toFixed(1)} hrs</div>
            <p className="text-xs text-emerald-600 mt-1">
              Current Tier: {viewedMonthHours <= 20 ? "$50/hr" : viewedMonthHours <= 100 ? "$40/hr" : "$30/hr"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 text-white border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-400 text-sm font-medium">Estimated Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${viewedMonthCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-slate-400 mt-1">
              {viewedMonthHours <= 20 ? `Next rate drop at 20 hrs` : viewedMonthHours <= 100 ? `Next rate drop at 100 hrs` : `Max rate applied`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-600 text-sm font-medium">Period Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3 pt-2">
            <StatusBadge status={viewedPeriodStatus} />
            <p className="text-xs text-slate-400">
              {viewedPeriodStatus === 'in_progress' ? 'Month in progress' :
               viewedPeriodStatus === 'invoiced' ? 'Invoice sent via QuickBooks' :
               'Awaiting invoice'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage detail table for viewed month */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-slate-800">
          Usage Details — {format(viewDate, 'MMMM yyyy')}
        </h2>
        <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-slate-700 font-semibold">Date (PST)</TableHead>
                <TableHead className="text-slate-700 font-semibold">Kitchen</TableHead>
                <TableHead className="text-slate-700 font-semibold">Time Range (PST)</TableHead>
                <TableHead className="text-slate-700 font-semibold">Duration</TableHead>
                <TableHead className="text-slate-700 font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {viewedMonthRecords.map((record: any) => {
                const datePST = new Date(record.clock_in).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", month: 'short', day: 'numeric' });
                const startPST = new Date(record.clock_in).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: 'numeric', minute: '2-digit' });
                const endPST = record.clock_out
                  ? new Date(record.clock_out).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: 'numeric', minute: '2-digit' })
                  : "Active";
                return (
                  <TableRow key={record.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <TableCell className="font-medium text-slate-900">{datePST}</TableCell>
                    <TableCell className="text-slate-900">{record.kitchens?.name || 'Unknown'}</TableCell>
                    <TableCell className="text-slate-700">{startPST} – {endPST}</TableCell>
                    <TableCell className="font-semibold text-slate-900">
                      {record.duration_minutes ? `${(record.duration_minutes / 60).toFixed(1)} hrs` : "—"}
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
              {viewedMonthRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                    No usage recorded for {format(viewDate, 'MMMM yyyy')}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Monthly History Panel */}
      {historyList.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-5 w-5 text-slate-400" />
            <h2 className="text-xl font-semibold text-slate-800">Monthly History</h2>
          </div>
          <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-slate-700 font-semibold">Month</TableHead>
                  <TableHead className="text-slate-700 font-semibold">Total Hours</TableHead>
                  <TableHead className="text-slate-700 font-semibold">Shifts</TableHead>
                  <TableHead className="text-slate-700 font-semibold">Estimated Cost</TableHead>
                  <TableHead className="text-slate-700 font-semibold">Status</TableHead>
                  <TableHead className="text-slate-700 font-semibold"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyList.map((period: any) => {
                  const hours = period.totalMinutes / 60;
                  const cost = calculateTieredCost(hours);
                  const monthName = period.date.toLocaleDateString('en-US', {
                    timeZone: 'America/Los_Angeles',
                    month: 'long',
                    year: 'numeric',
                  });
                  const isCurrent = period.month === currentMonthStr;
                  const isViewing = period.month === viewMonthStr;
                  let status = billingStatusMap[period.month];
                  if (!status) {
                    status = isCurrent ? 'in_progress' : 'pending';
                  }
                  return (
                    <TableRow
                      key={period.month}
                      className={`border-b border-slate-100 transition-colors ${isViewing ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}
                    >
                      <TableCell className="font-semibold text-slate-900">
                        {monthName}
                        {isCurrent && (
                          <span className="ml-2 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                            Current
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-900">{hours.toFixed(1)} hrs</TableCell>
                      <TableCell className="text-slate-600">{period.recordCount}</TableCell>
                      <TableCell className="text-slate-900 font-semibold">
                        ${cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`?month=${period.month}`}>
                          <Button
                            variant={isViewing ? "default" : "ghost"}
                            size="sm"
                            className={isViewing ? "bg-slate-900 text-white hover:bg-slate-800" : ""}
                          >
                            {isViewing ? "Viewing" : "View"}
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Invoices are sent via QuickBooks at the end of each billing period.
          </p>
        </div>
      )}
    </div>
  );
}