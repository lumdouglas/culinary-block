import { getRequests } from '@/app/actions/requests'
import { RequestsTable } from '@/components/admin/requests-table'
import { ClipboardList } from 'lucide-react'

export default async function AdminRequestsPage() {
    const requests = await getRequests()

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-teal-100 rounded-full p-3">
                        <ClipboardList className="h-6 w-6 text-teal-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Tenant Requests</h1>
                        <p className="text-slate-500">
                            Manage maintenance and rule violation requests from tenants
                        </p>
                    </div>
                </div>

                <RequestsTable requests={requests} />
            </div>
        </div>
    )
}
