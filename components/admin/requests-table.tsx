'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { updateRequest, type Request, type RequestStatus, type RequestPriority } from '@/app/actions/requests'
import { Wrench, AlertTriangle, Clock, CheckCircle, AlertCircle, Image as ImageIcon, X } from 'lucide-react'

interface RequestsTableProps {
    requests: Request[]
}

const statusColors: Record<RequestStatus, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
    resolved: 'bg-green-100 text-green-700 border-green-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200'
}

const statusLabels: Record<RequestStatus, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    approved: 'Approved',
    rejected: 'Rejected'
}

const priorityColors: Record<RequestPriority, string> = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700'
}

export function RequestsTable({ requests }: RequestsTableProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [filterType, setFilterType] = useState<string>('all')
    const [filterStatus, setFilterStatus] = useState<string>('all')

    const filteredRequests = requests.filter(req => {
        if (filterType !== 'all' && req.type !== filterType) return false
        if (filterStatus !== 'all' && req.status !== filterStatus) return false
        return true
    })

    const handleStatusChange = (request: Request, status: RequestStatus) => {
        startTransition(async () => {
            const result = await updateRequest(request, { status })
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Status updated')
            }
        })
    }

    const handlePriorityChange = (request: Request, priority: RequestPriority) => {
        startTransition(async () => {
            const result = await updateRequest(request, { priority })
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Priority updated')
            }
        })
    }

    return (
        <>
            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <div>
                    <label className="text-sm font-medium text-slate-600 mb-1 block">Type</label>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="h-10 px-3 rounded-md border border-slate-200 bg-white"
                    >
                        <option value="all">All Types</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="rule_violation">Rule Violation</option>
                        <option value="timesheet">Timesheet</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-600 mb-1 block">Status</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="h-10 px-3 rounded-md border border-slate-200 bg-white"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved/Approved</option>
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-amber-700">
                        <Clock className="h-5 w-5" />
                        <span className="font-medium">Pending</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-800 mt-1">
                        {requests.filter(r => r.status === 'pending').length}
                    </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-blue-700">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">In Progress</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-800 mt-1">
                        {requests.filter(r => r.status === 'in_progress').length}
                    </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Resolved/Approved</span>
                    </div>
                    <p className="text-2xl font-bold text-green-800 mt-1">
                        {requests.filter(r => ['resolved', 'approved'].includes(r.status)).length}
                    </p>
                </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-600">Tenant</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-600">Description</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-600">Photo</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-600">Priority</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRequests.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-12 text-slate-400">
                                    No requests found
                                </td>
                            </tr>
                        ) : (
                            filteredRequests.map((request) => (
                                <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        {new Date(request.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-slate-900">
                                            {request.profiles?.company_name || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-slate-500">{request.profiles?.email}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${request.type === 'maintenance'
                                            ? 'bg-teal-100 text-teal-700'
                                            : request.type === 'timesheet'
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {request.type === 'maintenance' ? (
                                                <Wrench className="h-3 w-3" />
                                            ) : request.type === 'timesheet' ? (
                                                <Clock className="h-3 w-3" />
                                            ) : (
                                                <AlertTriangle className="h-3 w-3" />
                                            )}
                                            {request.type === 'maintenance' ? 'Maintenance'
                                                : request.type === 'timesheet' ? 'Timesheet'
                                                    : 'Rule Violation'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 max-w-xs">
                                        <div className="text-sm text-slate-700 whitespace-pre-wrap max-h-20 overflow-y-auto" title={request.description}>
                                            {request.description}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {request.photo_url ? (
                                            <button
                                                onClick={() => setSelectedImage(request.photo_url)}
                                                className="text-teal-600 hover:text-teal-800 flex items-center gap-1"
                                            >
                                                <ImageIcon className="h-4 w-4" />
                                                <span className="text-sm">View</span>
                                            </button>
                                        ) : (
                                            <span className="text-slate-400 text-sm">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={request.priority}
                                            onChange={(e) => handlePriorityChange(request, e.target.value as RequestPriority)}
                                            disabled={isPending || request.type === 'timesheet'}
                                            className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${request.type === 'timesheet' ? 'opacity-50 cursor-not-allowed' : ''} ${priorityColors[request.priority]}`}
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={request.status}
                                            onChange={(e) => handleStatusChange(request, e.target.value as RequestStatus)}
                                            disabled={isPending}
                                            className={`px-2 py-1 rounded text-xs font-medium border cursor-pointer ${statusColors[request.status]}`}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="resolved">Resolved</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {filteredRequests.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        No requests found
                    </div>
                ) : (
                    filteredRequests.map((request) => (
                        <div key={request.id} className="bg-white rounded-xl shadow border border-slate-100 p-4">
                            {/* Header: Date + Status Badge */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-slate-500">
                                    {new Date(request.created_at).toLocaleDateString()}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${request.type === 'maintenance'
                                    ? 'bg-teal-100 text-teal-700'
                                    : request.type === 'timesheet'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {request.type === 'maintenance' ? (
                                        <Wrench className="h-3 w-3" />
                                    ) : request.type === 'timesheet' ? (
                                        <Clock className="h-3 w-3" />
                                    ) : (
                                        <AlertTriangle className="h-3 w-3" />
                                    )}
                                    {request.type === 'maintenance' ? 'Maintenance'
                                        : request.type === 'timesheet' ? 'Timesheet'
                                            : 'Violation'}
                                </span>
                            </div>

                            {/* Tenant Info */}
                            <div className="mb-3">
                                <h3 className="font-semibold text-slate-900 leading-tight">
                                    {request.profiles?.company_name || 'Unknown Company'}
                                </h3>
                                <p className="text-xs text-slate-500">{request.profiles?.email}</p>
                            </div>

                            {/* Description */}
                            <div className="mb-4 bg-slate-50 p-3 rounded-lg text-sm text-slate-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                {request.description}
                            </div>

                            {/* Actions Row */}
                            <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
                                {/* Photo Button */}
                                {request.photo_url ? (
                                    <button
                                        onClick={() => setSelectedImage(request.photo_url)}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                                    >
                                        <ImageIcon className="h-4 w-4" />
                                        View Photo
                                    </button>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-400 bg-slate-50 rounded-lg cursor-not-allowed">
                                        <ImageIcon className="h-4 w-4 opacity-50" />
                                        No Photo
                                    </div>
                                )}
                            </div>

                            {/* Controls Row */}
                            <div className="mt-3 grid grid-cols-2 gap-3">
                                {/* Priority Dropdown */}
                                <div>
                                    <label className="text-xs font-medium text-slate-500 mb-1 block">Priority</label>
                                    <select
                                        value={request.priority}
                                        onChange={(e) => handlePriorityChange(request, e.target.value as RequestPriority)}
                                        disabled={isPending || request.type === 'timesheet'}
                                        className={`w-full h-9 px-2 rounded-lg text-sm font-medium border-0 cursor-pointer ${request.type === 'timesheet' ? 'opacity-50 cursor-not-allowed' : ''} ${priorityColors[request.priority]}`}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>

                                {/* Status Dropdown */}
                                <div>
                                    <label className="text-xs font-medium text-slate-500 mb-1 block">Status</label>
                                    <select
                                        value={request.status}
                                        onChange={(e) => handleStatusChange(request, e.target.value as RequestStatus)}
                                        disabled={isPending}
                                        className={`w-full h-9 px-2 rounded-lg text-sm font-medium border cursor-pointer ${statusColors[request.status]}`}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-10 right-0 text-white hover:text-slate-300"
                        >
                            <X className="h-8 w-8" />
                        </button>
                        <img
                            src={selectedImage}
                            alt="Request photo"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg"
                        />
                    </div>
                </div>
            )}
        </>
    )
}
