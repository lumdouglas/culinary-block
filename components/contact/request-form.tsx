'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createRequest, type RequestType } from '@/app/actions/requests'
import { createTicket } from '@/app/actions/maintenance'
import { createClient } from '@/utils/supabase/client'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Wrench, AlertTriangle, Camera, Send, Loader2 } from 'lucide-react'

// Rule violation categories for the dropdown
const VIOLATION_CATEGORIES = [
    'Dirty community areas (prep tables, sinks, floors)',
    'Lights, hood, or equipment left on',
    'Front doors left unlocked',
    'Unauthorized use of my storage area',
    'Trash or cardboard not properly disposed',
    'Community carts left dirty',
    'Other'
]

interface Kitchen {
    id: string
    name: string
}

export function RequestForm({ kitchens }: { kitchens: Kitchen[] }) {
    const [activeTab, setActiveTab] = useState<RequestType>('maintenance')
    const [selectedRule, setSelectedRule] = useState<string>('')
    const [kitchenId, setKitchenId] = useState<string>('')
    const [priority, setPriority] = useState<string>('medium')
    const [isPending, startTransition] = useTransition()

    const supabase = createClient()

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            if (activeTab === 'maintenance') {
                // Upload photo if present
                const photoFile = formData.get('photo') as File | null
                let photoUrlStr = ''

                if (photoFile && photoFile.size > 0) {
                    const { data: { user } } = await supabase.auth.getUser()
                    if (user) {
                        const fileExt = photoFile.name.split('.').pop()
                        const fileName = `${user.id}/${Date.now()}.${fileExt}`

                        const { error: uploadError } = await supabase.storage
                            .from('request-photos')
                            .upload(fileName, photoFile)

                        if (!uploadError) {
                            const { data: urlData } = supabase.storage
                                .from('request-photos')
                                .getPublicUrl(fileName)
                            photoUrlStr = urlData.publicUrl
                        }
                    }
                }

                const ticketData = new FormData()
                ticketData.set('title', formData.get('title') as string)
                ticketData.set('description', formData.get('description') as string)
                ticketData.set('priority', priority || 'medium')
                if (kitchenId && kitchenId !== 'general') {
                    ticketData.set('kitchen_id', kitchenId)
                }
                if (photoUrlStr) {
                    ticketData.set('photo_url', photoUrlStr)
                }

                const result = await createTicket(null, ticketData)
                if (result.error) {
                    toast.error(result.error)
                } else {
                    toast.success('Maintenance ticket submitted successfully!')
                    const form = document.getElementById('request-form') as HTMLFormElement
                    form?.reset()
                    setKitchenId('')
                    setPriority('medium')
                }
            } else {
                // Rule violation — goes to requests table
                formData.set('type', 'rule_violation')
                if (selectedRule) {
                    const description = formData.get('description') as string
                    formData.set('description', `Rule: ${selectedRule}\n\n${description}`)
                }

                const result = await createRequest(formData)
                if (result.error) {
                    toast.error(result.error)
                } else {
                    toast.success('Request submitted successfully!')
                    const form = document.getElementById('request-form') as HTMLFormElement
                    form?.reset()
                    setSelectedRule('')
                }
            }
        })
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    type="button"
                    onClick={() => setActiveTab('maintenance')}
                    className={`flex-1 px-6 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'maintenance'
                        ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-600'
                        : 'text-slate-500 hover:bg-slate-50'
                        }`}
                >
                    <Wrench className="h-5 w-5" />
                    Maintenance Request
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('rule_violation')}
                    className={`flex-1 px-6 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'rule_violation'
                        ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-600'
                        : 'text-slate-500 hover:bg-slate-50'
                        }`}
                >
                    <AlertTriangle className="h-5 w-5" />
                    Report Rule Violation
                </button>
            </div>

            {/* Form */}
            <form id="request-form" action={handleSubmit} className="p-6 space-y-5">

                {/* ── MAINTENANCE FIELDS ── */}
                {activeTab === 'maintenance' && (
                    <>
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                name="title"
                                required
                                placeholder="e.g., Oven not heating in Hood 1L"
                            />
                        </div>

                        {/* Kitchen */}
                        <div className="space-y-2">
                            <Label htmlFor="kitchen">Kitchen</Label>
                            <Select value={kitchenId} onValueChange={setKitchenId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select location (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">General Facility</SelectItem>
                                    {kitchens.map((k) => (
                                        <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Priority */}
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Details */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Details</Label>
                            <Textarea
                                id="description"
                                name="description"
                                required
                                placeholder="Describe the issue clearly..."
                                className="min-h-[100px] resize-none"
                            />
                        </div>
                    </>
                )}

                {/* ── RULE VIOLATION FIELDS ── */}
                {activeTab === 'rule_violation' && (
                    <>
                        {/* Rule selector */}
                        <div className="space-y-2">
                            <Label htmlFor="rule">Which rule was violated?</Label>
                            <select
                                id="rule"
                                value={selectedRule}
                                onChange={(e) => setSelectedRule(e.target.value)}
                                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="">Select a rule...</option>
                                {VIOLATION_CATEGORIES.map((rule, i) => (
                                    <option key={i} value={rule}>{rule}</option>
                                ))}
                            </select>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Describe what happened</Label>
                            <Textarea
                                id="description"
                                name="description"
                                required
                                placeholder="e.g., On Tuesday at 3pm, I noticed..."
                                className="min-h-[120px] resize-none"
                            />
                        </div>
                    </>
                )}

                {/* Photo upload (both tabs) */}
                <div className="space-y-2">
                    <Label htmlFor="photo" className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Attach Photo (optional)
                    </Label>
                    <Input
                        type="file"
                        id="photo"
                        name="photo"
                        accept="image/*"
                        className="cursor-pointer"
                    />
                    <p className="text-xs text-slate-500">
                        Upload a photo to help us understand the issue better
                    </p>
                </div>

                {/* Submit */}
                <Button
                    type="submit"
                    className="w-full h-12 text-lg bg-teal-600 hover:bg-teal-700"
                    disabled={isPending}
                >
                    {isPending ? (
                        <Loader2 className="animate-spin mr-2" />
                    ) : (
                        <Send className="mr-2 h-5 w-5" />
                    )}
                    {isPending ? 'Submitting...' : 'Submit Request'}
                </Button>
            </form>
        </div>
    )
}
