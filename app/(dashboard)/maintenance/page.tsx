import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { CreateTicketForm } from "@/components/maintenance/create-ticket-form";

export default async function MaintenancePage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
    const isAdmin = profile?.role === 'admin';

    let ticketsQuery = supabase
        .from("maintenance_tickets")
        .select("*, profiles:user_id(company_name), kitchens(name)")
        .order("created_at", { ascending: false });

    if (!isAdmin) {
        ticketsQuery = ticketsQuery.eq('user_id', user?.id);
    }

    const { data: tickets } = await ticketsQuery;

    // Get kitchens for the form
    const { data: kitchens } = await supabase.from("kitchens").select("id, name").eq("is_active", true);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Maintenance</h1>
                    <p className="text-slate-500">
                        {isAdmin ? "Track all equipment issues" : "Report and track equipment issues"}
                    </p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button data-testid="report-issue-button">
                            <Plus className="w-4 h-4 mr-2" />
                            Report Issue
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Report Maintenance Issue</DialogTitle>
                            <DialogDescription>
                                Describe the issue clearly. We will address it as soon as possible.
                            </DialogDescription>
                        </DialogHeader>
                        <CreateTicketForm kitchens={kitchens || []} />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-100 border-b border-slate-300">
                        <TableRow className="border-slate-300 hover:bg-transparent">
                            <TableHead className="text-slate-900 font-bold">Issue</TableHead>
                            <TableHead className="text-slate-900 font-bold">Location</TableHead>
                            {isAdmin && <TableHead className="text-slate-900 font-bold">Reported By</TableHead>}
                            <TableHead className="text-slate-900 font-bold">Date</TableHead>
                            <TableHead className="text-slate-900 font-bold">Priority</TableHead>
                            <TableHead className="text-slate-900 font-bold">Status</TableHead>
                            <TableHead className="text-right text-slate-900 font-bold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tickets?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-12 text-slate-600 font-medium">
                                    {isAdmin ? "No maintenance tickets found." : "No maintenance requests yet."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            tickets?.map((ticket) => (
                                <TableRow key={ticket.id}>
                                    <TableCell className="font-medium max-w-[200px] truncate">
                                        {ticket.title}
                                    </TableCell>
                                    <TableCell className="text-slate-900">
                                        {ticket.kitchens?.name || "General Facility"}
                                    </TableCell>
                                    {isAdmin && (
                                        <TableCell className="text-slate-900">
                                            {ticket.profiles?.company_name || "Unknown"}
                                        </TableCell>
                                    )}
                                    <TableCell className="text-slate-700">
                                        {format(new Date(ticket.created_at), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <PriorityBadge priority={ticket.priority} />
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={ticket.status} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/maintenance/${ticket.id}`}>
                                            <Button variant="ghost" size="sm">
                                                View
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        open: "bg-blue-100 text-blue-700",
        in_progress: "bg-yellow-100 text-yellow-700",
        resolved: "bg-green-100 text-green-700",
        closed: "bg-slate-100 text-slate-700",
    };

    return (
        <Badge
            variant="secondary"
            className={styles[status as keyof typeof styles] || "bg-gray-100"}
        >
            {status.replace("_", " ").toUpperCase()}
        </Badge>
    );
}

function PriorityBadge({ priority }: { priority: string }) {
    const styles = {
        low: "bg-slate-100 text-slate-700",
        medium: "bg-blue-50 text-blue-600",
        high: "bg-orange-50 text-orange-600",
        critical: "bg-red-50 text-red-600",
    };

    return (
        <Badge
            variant="outline"
            className={styles[priority as keyof typeof styles] || "bg-gray-100"}
        >
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
        </Badge>
    );
}
