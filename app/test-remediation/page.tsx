
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronLeft, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function RemediationVerificationPage() {
    return (
        <div className="p-8 bg-white min-h-screen space-y-12 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900">Remediation Verification</h1>

            {/* SECTION 1: MAINTENANCE TABLE HEADERS */}
            <section className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">1. Maintenance Table Headers</h2>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-100 border-b border-slate-300">
                            <TableRow className="border-slate-300 hover:bg-transparent">
                                <TableHead className="text-slate-900 font-bold">Issue</TableHead>
                                <TableHead className="text-slate-900 font-bold">Location</TableHead>
                                <TableHead className="text-slate-900 font-bold">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow className="border-b border-slate-200">
                                <TableCell className="font-medium max-w-[200px] truncate">Broken Oven</TableCell>
                                <TableCell className="text-slate-900">Kitchen A</TableCell>
                                <TableCell><Badge variant="secondary" className="bg-yellow-100 text-yellow-700">IN PROGRESS</Badge></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </section>

            {/* SECTION 2: BILLING ACTUAL DURATION */}
            <section className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">2. Billing: Actual Duration</h2>
                <div className="rounded-md border bg-white overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-100 border-b border-slate-300">
                            <TableRow className="border-slate-300 hover:bg-transparent">
                                <TableHead className="text-slate-900 font-bold">Time Range</TableHead>
                                <TableHead className="text-slate-900 font-bold">Actual Duration</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow className="border-b border-slate-200">
                                <TableCell className="text-slate-700">10:00 AM - 2:00 PM</TableCell>
                                <TableCell className="font-bold text-slate-900">4.0 hrs</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </section>

            {/* SECTION 3: SETTINGS HELPER TEXT */}
            <section className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">3. Settings Helper Text</h2>
                <div className="bg-white p-6 border rounded-xl shadow-sm">
                    <p className="text-sm text-slate-700">Your company details</p>
                    <p className="text-sm text-slate-700 mt-2">How we can reach you</p>
                </div>
            </section>

            {/* SECTION 4: INVOICE DETAIL BACK LINK */}
            <section className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">4. Invoice Detail Back Link</h2>
                <div className="text-sm text-slate-700 hover:text-slate-900 flex items-center">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Invoices
                </div>
            </section>
        </div>
    )
}
