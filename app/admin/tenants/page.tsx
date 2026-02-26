"use client"

import { useEffect, useState } from "react";
import { Profile } from "@/types/database";
import { getTenants, toggleTenantActive } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Search, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default function AdminTenantsPage() {
    const [tenants, setTenants] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [tenantToDeactivate, setTenantToDeactivate] = useState<Profile | null>(null);

    const loadTenants = async () => {
        setLoading(true);
        const result = await getTenants();
        if (result.error) {
            toast.error(result.error);
        } else if (result.data) {
            setTenants(result.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadTenants();
    }, []);

    const handleToggleActive = async (tenant: Profile, checked: boolean) => {
        // If turning off, show confirmation dialog
        if (!checked) {
            setTenantToDeactivate(tenant);
            return;
        }

        // If turning on, do it immediately
        await updateTenantStatus(tenant.id, true);
    };

    const updateTenantStatus = async (id: string, isActive: boolean) => {
        const result = await toggleTenantActive(id, isActive);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(`Tenant ${isActive ? 'activated' : 'deactivated'} successfully.`);
            // Optimistic update
            setTenants(prev => prev.map(t => t.id === id ? { ...t, is_active: isActive } : t));
        }
        setTenantToDeactivate(null);
    };

    const filteredTenants = tenants.filter(tenant =>
        tenant.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto py-12 px-6">
                <div className="mb-8">
                    <Link href="/admin/applications" className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm mb-4">
                        <ArrowLeft className="w-4 h-4" /> Back to Applications
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <Users className="w-8 h-8 text-blue-600" />
                        </div>
                        <h1 className="text-4xl font-bold">Tenant Management</h1>
                    </div>
                    <p className="text-slate-600 ml-14">Manage active tenants and their access to the kiosk and booking system</p>
                </div>

                {/* Stats & Search */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-start md:items-end">
                    <div className="flex gap-4">
                        <Card className="p-4 px-6 bg-white border-slate-200">
                            <p className="text-sm text-slate-500 font-medium">Active Tenants</p>
                            <p className="text-2xl font-bold text-green-700">{tenants.filter(t => t.is_active).length}</p>
                        </Card>
                        <Card className="p-4 px-6 bg-white border-slate-200">
                            <p className="text-sm text-slate-500 font-medium">Inactive</p>
                            <p className="text-2xl font-bold text-slate-700">{tenants.filter(t => !t.is_active).length}</p>
                        </Card>
                    </div>

                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search tenants..."
                            className="pl-9 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Tenants List */}
                {loading ? (
                    <div className="text-center py-12">Loading tenants...</div>
                ) : filteredTenants.length === 0 ? (
                    <Card className="p-8 text-center text-slate-500">
                        No tenants found.
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {filteredTenants.map((tenant) => (
                            <Card key={tenant.id} className="p-6 transition-all hover:shadow-md">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="flex-1 w-full flex flex-col gap-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-xl font-bold text-slate-900">{tenant.company_name}</h3>
                                            {tenant.is_active ? (
                                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                                    Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-slate-500 bg-slate-100">
                                                    Inactive
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
                                            <p>{tenant.email}</p>
                                            <p className="hidden md:block">•</p>
                                            <p>Join Date: {new Date(tenant.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-start md:items-end gap-1 w-full md:w-auto">
                                            <span className="text-sm font-medium text-slate-700">
                                                {tenant.is_active ? 'Kiosk Access Enabled' : 'Kiosk Access Disabled'}
                                            </span>
                                            <Switch
                                                checked={tenant.is_active || false}
                                                onCheckedChange={(checked) => handleToggleActive(tenant, checked)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Deactivation Confirmation Dialog */}
            <AlertDialog open={!!tenantToDeactivate} onOpenChange={(open) => !open && setTenantToDeactivate(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate Tenant?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to deactivate <strong>{tenantToDeactivate?.company_name}</strong>?
                            <br /><br />
                            They will no longer be able to:
                            <ul className="list-disc list-inside mt-2">
                                <li>Log in to the Kiosk</li>
                                <li>Make new bookings</li>
                            </ul>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => tenantToDeactivate && updateTenantStatus(tenantToDeactivate.id, false)}
                        >
                            Deactivate
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
