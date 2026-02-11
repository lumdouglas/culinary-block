import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { updateTicketStatus } from "@/app/actions/maintenance";

export default async function TicketDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch ticket details
    const { data: ticket } = await supabase
        .from("maintenance_tickets")
        .select("*, profiles:user_id(company_name, email), kitchens(name)")
        .eq("id", id)
        .single();

    if (!ticket) {
        notFound();
    }

    // Check if user is admin (to show admin actions)
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
    const isAdmin = profile?.role === 'admin';
    const isOwner = user?.id === ticket.user_id;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-6">
                <Link
                    href="/maintenance"
                    className="text-sm text-slate-700 hover:text-slate-900 flex items-center"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Maintenance
                </Link>
            </div>

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                        {ticket.title}
                    </h1>
                    <div className="flex items-center gap-2 mt-2 text-slate-700">
                        <span>Reported by {ticket.profiles?.company_name}</span>
                        <span>•</span>
                        <span>{format(new Date(ticket.created_at), "PPP p")}</span>
                    </div>
                </div>

                {/* Actions for Admin or Owner */}
                <div className="flex gap-2">
                    {(isAdmin || isOwner) && ticket.status !== 'closed' && (
                        <form action={async () => {
                            'use server';
                            // If open, move to in_progress
                            // If in_progress, move to resolved
                            // If resolved, move to closed (or reopen)
                            // Simplified logic:
                            let nextStatus: any = 'in_progress';
                            if (ticket.status === 'open') nextStatus = 'in_progress';
                            else if (ticket.status === 'in_progress') nextStatus = 'resolved';
                            else if (ticket.status === 'resolved') nextStatus = 'closed';

                            await updateTicketStatus(id, nextStatus);
                        }}>
                            <Button type="submit">
                                {ticket.status === 'open' && "Mark In Progress"}
                                {ticket.status === 'in_progress' && "Resolve Ticket"}
                                {ticket.status === 'resolved' && "Close Ticket"}
                            </Button>
                        </form>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap text-slate-900">{ticket.description}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-sm text-slate-700 mb-1">Status</div>
                                <StatusBadge status={ticket.status} />
                            </div>
                            <div>
                                <div className="text-sm text-slate-700 mb-1">Priority</div>
                                <PriorityBadge priority={ticket.priority} />
                            </div>
                            <div>
                                <div className="text-sm text-slate-700 mb-1">Location</div>
                                <div className="font-medium">{ticket.kitchens?.name || "General Facility"}</div>
                            </div>
                            <div>
                                <div className="text-sm text-slate-700 mb-1">Contact</div>
                                <div className="font-medium truncate">{ticket.profiles?.email}</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
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
