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

export default async function BillingPage() {
  const supabase = await createClient();

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Fetch usage and kitchen details
  const { data: records } = await supabase
    .from('bookings')
    .select(`
      id,
      start_time,
      end_time,
      kitchens(name),
      timesheets(clock_in, clock_out, duration_minutes)
    `)
    .order('start_time', { ascending: false });

  // Calculate cumulative stats for the current month
  const monthlyTimesheets = records?.flatMap(r => r.timesheets) || [];
  const totalMinutes = monthlyTimesheets.reduce((acc, curr: any) => acc + (curr.duration_minutes || 0), 0);
  const totalHours = totalMinutes / 60;
  const currentMonthCost = calculateTieredCost(totalHours);

  // Group records by month for history
  const history = records?.reduce((acc: any, record: any) => {
    const date = new Date(record.start_time);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!acc[key]) {
      acc[key] = {
        month: key,
        date: date, // Keep a date object for formatting
        totalMinutes: 0,
        recordCount: 0
      };
    }

    const timesheet = record.timesheets?.[0];
    if (timesheet?.duration_minutes) {
      acc[key].totalMinutes += timesheet.duration_minutes;
    }
    acc[key].recordCount++;

    return acc;
  }, {});

  const historyList = Object.values(history || {}).sort((a: any, b: any) => b.month.localeCompare(a.month));

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Usage</h1>
        <p className="text-slate-500">Your rates adjust automatically as you use more hours.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-900 text-sm font-medium">Current Month Usage</CardTitle>
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
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Estimated Cost</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyList.map((period: any) => {
                const hours = period.totalMinutes / 60;
                const cost = calculateTieredCost(hours);
                const monthName = period.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                const isCurrentMonth = period.month === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

                return (
                  <TableRow key={period.month}>
                    <TableCell className="font-medium">{monthName}</TableCell>
                    <TableCell>{hours.toFixed(1)} hrs</TableCell>
                    <TableCell>{period.recordCount}</TableCell>
                    <TableCell>${cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <Badge variant={isCurrentMonth ? "outline" : "default"}>
                        {isCurrentMonth ? "In Progress" : "Invoiced"}
                      </Badge>
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
      </div>

      {/* Usage Table */}
      <div>
        <h2 className="text-xl font-bold mb-4">Recent Usage Details</h2>
        <div className="rounded-md border bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Kitchen</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Actual Duration</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records?.slice(0, 50).map((record: any) => {
                const timesheet = record.timesheets?.[0];
                const date = new Date(record.start_time).toLocaleDateString();
                const scheduled = `${new Date(record.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(record.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{date}</TableCell>
                    <TableCell>{record.kitchens?.name}</TableCell>
                    <TableCell className="text-slate-500">{scheduled}</TableCell>
                    <TableCell>
                      {timesheet?.duration_minutes
                        ? `${(timesheet.duration_minutes / 60).toFixed(1)} hrs`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={timesheet?.clock_out ? "default" : "secondary"}>
                        {timesheet?.clock_out ? "Verified" : "Upcoming/Pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}