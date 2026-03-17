import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, TrendingUp, CalendarCheck, DollarSign, Activity } from "lucide-react"

export default function Overview() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Agent Overview</h1>
        <div className="flex gap-3">
          <Button variant="outline">Download Report</Button>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white">Approve Pending Actions <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">3</span></Button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Leads (7d)</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-emerald-600 font-medium flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" /> +12% from last week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Booking Value</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,250</div>
            <p className="text-xs text-emerald-600 font-medium flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" /> +$450 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kitchen Utilization</CardTitle>
            <CalendarCheck className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">84%</div>
            <p className="text-xs text-amber-600 font-medium flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" /> Near capacity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agent Health</CardTitle>
            <Activity className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">Optimal</div>
            <p className="text-xs text-slate-500 mt-1">
              All 5 modules running normally
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity Log */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Autonomous Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: "10 mins ago", action: "Generated draft blog post for 'San Jose Commercial Baking Space'", module: "SEO Engine" },
                { time: "1 hour ago", action: "Paused underperforming Google Ad group 'Cheap Kitchens'", module: "Ads Manager" },
                { time: "3 hours ago", action: "Identified 4 open slots next Tuesday, emailed top 15 waitlist leads.", module: "Operations" },
                { time: "5 hours ago", action: "Drafted 2 LinkedIn posts comparing Revent ovens to standard convection.", module: "Content Engine" },
              ].map((log, i) => (
                <div key={i} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="w-2 h-2 mt-2 rounded-full bg-teal-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{log.action}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{log.time} • {log.module}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions / Recommendations */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>AI Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="font-semibold text-blue-900 text-sm mb-1">Increase Bid strategy on Meta</h4>
                <p className="text-xs text-blue-800 mb-3">The term "caterer prep space San Jose" is converting at 12%. Recommend adding $15/day.</p>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-7 text-xs">Approve & Apply</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs">Dismiss</Button>
                </div>
              </div>
              
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                <h4 className="font-semibold text-amber-900 text-sm mb-1">Post to X (Twitter)</h4>
                <p className="text-xs text-amber-800 mb-3">Draft ready: Hook covering the pain of health department permits vs our AI solver.</p>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 h-7 text-xs">Review Post</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
