"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

interface TenantFilterProps {
    tenants: any[]
    selectedTenantId?: string
}

export function TenantFilter({ tenants, selectedTenantId }: TenantFilterProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const handleTenantChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value === "all") {
            params.delete("tenantId")
        } else {
            params.set("tenantId", value)
        }
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-700">Filter by Tenant:</span>
            <Select
                value={selectedTenantId || "all"}
                onValueChange={handleTenantChange}
            >
                <SelectTrigger className="w-[250px] bg-white">
                    <SelectValue placeholder="All Tenants" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Tenants</SelectItem>
                    {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.company_name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
