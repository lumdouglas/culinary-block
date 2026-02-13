"use client"

import { useEffect, useState } from "react";
import { Application } from "@/types/database";
import { getApplications, approveApplication, rejectApplication } from "@/app/actions/admin";
import { ApplicationDetails } from "@/components/application-details";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Eye } from "lucide-react";

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadApplications = async () => {
    setLoading(true);
    const result = await getApplications(filter);
    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      setApplications(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadApplications();
  }, [filter]);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    const result = await approveApplication(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Application approved! Invitation email sent.");
      loadApplications();
      setSelectedApplication(null);
    }
    setActionLoading(false);
  };

  const handleReject = async (id: string) => {
    setActionLoading(true);
    const reason = prompt("Rejection reason (optional):");
    const result = await rejectApplication(id, reason || undefined);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Application rejected.");
      loadApplications();
      setSelectedApplication(null);
    }
    setActionLoading(false);
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Application Management</h1>
          <p className="text-slate-600">Review and manage kitchen space applications</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
          >
            Pending
          </Button>
          <Button
            variant={filter === "approved" ? "default" : "outline"}
            onClick={() => setFilter("approved")}
          >
            Approved
          </Button>
          <Button
            variant={filter === "rejected" ? "default" : "outline"}
            onClick={() => setFilter("rejected")}
          >
            Rejected
          </Button>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="text-center py-12">Loading applications...</div>
        ) : applications.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            No applications found for this filter.
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <Card key={app.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{app.company_name}</h3>
                      <Badge className={statusColors[app.status]}>
                        {app.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Contact</p>
                        <p className="font-medium">
                          {app.contact_first_name} {app.contact_last_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Email</p>
                        <p className="font-medium">{app.email}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Phone</p>
                        <p className="font-medium">{app.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Cuisine</p>
                        <p className="font-medium">{app.cuisine_type || 'N/A'}</p>
                      </div>
                    </div>
                    {app.submitted_at && (
                      <p className="text-xs text-slate-400 mt-2">
                        Submitted: {new Date(app.submitted_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedApplication(app)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {app.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(app.id)}
                          disabled={actionLoading}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(app.id)}
                          disabled={actionLoading}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Application Details Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review complete application information
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div>
              <ApplicationDetails application={selectedApplication} />

              {selectedApplication.status === 'pending' && (
                <div className="flex gap-2 mt-6 pt-6 border-t">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(selectedApplication.id)}
                    disabled={actionLoading}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve & Send Invitation
                  </Button>
                  <Button
                    className="flex-1"
                    variant="destructive"
                    onClick={() => handleReject(selectedApplication.id)}
                    disabled={actionLoading}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Application
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}