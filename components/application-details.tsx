import { Application } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ApplicationDetailsProps {
    application: Application;
}

export function ApplicationDetails({ application }: ApplicationDetailsProps) {
    const statusColors = {
        pending: "bg-yellow-100 text-yellow-800",
        approved: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">{application.company_name}</h3>
                <Badge className={statusColors[application.status]}>
                    {application.status.toUpperCase()}
                </Badge>
            </div>

            {/* Company Information */}
            <Card className="p-4">
                <h4 className="font-semibold text-lg mb-3">Company Information</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-slate-500">Company Name</p>
                        <p className="font-medium">{application.company_name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Address</p>
                        <p className="font-medium">{application.address || 'N/A'}</p>
                    </div>
                </div>
            </Card>

            {/* Main Contact */}
            <Card className="p-4">
                <h4 className="font-semibold text-lg mb-3">Main Contact</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-slate-500">Name</p>
                        <p className="font-medium">
                            {application.contact_first_name} {application.contact_last_name}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Email</p>
                        <p className="font-medium">{application.email}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Phone</p>
                        <p className="font-medium">{application.phone || 'N/A'}</p>
                    </div>
                </div>
            </Card>

            {/* Business Details */}
            <Card className="p-4">
                <h4 className="font-semibold text-lg mb-3">Business Details</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-slate-500">Website</p>
                        <p className="font-medium">{application.website || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Years in Operation</p>
                        <p className="font-medium">{application.years_in_operation || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Social Media</p>
                        <p className="font-medium">{application.social_media || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Cuisine Type</p>
                        <p className="font-medium">{application.cuisine_type || 'N/A'}</p>
                    </div>
                </div>
            </Card>

            {/* Operational Requirements */}
            <Card className="p-4">
                <h4 className="font-semibold text-lg mb-3">Operational Requirements</h4>
                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Kitchen Use Description</p>
                        <p className="text-sm">{application.kitchen_use_description || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Usage Hours</p>
                        <p className="text-sm">{application.usage_hours || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Equipment Needed</p>
                        <p className="text-sm">{application.equipment_needed || 'N/A'}</p>
                    </div>
                </div>
            </Card>

            {/* Review Information */}
            {application.reviewed_at && (
                <Card className="p-4 bg-slate-50">
                    <h4 className="font-semibold text-lg mb-3">Review Information</h4>
                    <div className="space-y-2">
                        <div>
                            <p className="text-sm text-slate-500">Reviewed At</p>
                            <p className="text-sm">{new Date(application.reviewed_at).toLocaleString()}</p>
                        </div>
                        {application.notes && (
                            <div>
                                <p className="text-sm text-slate-500">Notes</p>
                                <p className="text-sm">{application.notes}</p>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}
