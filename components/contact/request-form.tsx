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

export function RequestForm() {
    const [activeTab, setActiveTab] = useState<RequestType>('maintenance')
    const [selectedRule, setSelectedRule] = useState<string>('')
    const [isPending, startTransition] = useTransition()

    const supabase = createClient()

    const handleSubmit = async (formData: FormData) => {
        // Add the type to form data for requests branch
        formData.set('type', 'rule_violation')

        // If rule violation, prepend the selected rule to description
        if (activeTab === 'rule_violation' && selectedRule) {
            const description = formData.get('description') as string
            formData.set('description', `Rule: ${selectedRule}\n\n${description}`)
        }

        startTransition(async () => {
            if (activeTab === 'maintenance') {
                // Handle as a maintenance ticket

                // 1. Upload photo if present (since createTicket doesn't handle photos directly yet)
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
                            photoUrlStr = `\n\n[Attached Photo](${urlData.publicUrl})`
                        }
                    }
                }

                // 2. Format ticket data
                const ticketData = new FormData()
                ticketData.set('title', 'Maintenance Request (Contact Page)')
                ticketData.set('description', (formData.get('description') as string) + photoUrlStr)
                ticketData.set('priority', 'medium')
                // Note: kitchen_id is left null (General Facility)

                const result = await createTicket(null, ticketData)
                if (result.error) {
                    toast.error(result.error)
                } else {
                    toast.success('Maintenance ticket submitted successfully!')
                    const form = document.getElementById('request-form') as HTMLFormElement
                    form?.reset()
                    setSelectedRule('')
                }
            } else {
                // Handle as a rule violation request
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
            <form id="request-form" action={handleSubmit} className="p-6 space-y-6">
                {/* Rule selector (only for violations) */}
                {activeTab === 'rule_violation' && (
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
                                <option key={i} value={rule}>
                                    {rule}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                    <Label htmlFor="description">
                        {activeTab === 'maintenance'
                            ? 'Describe the issue'
                            : 'Describe what happened'}
                    </Label>
                    <Textarea
                        id="description"
                        name="description"
                        required
                        placeholder={
                            activeTab === 'maintenance'
                                ? 'e.g., The oven in Hood 1L is not heating properly...'
                                : 'e.g., On Tuesday at 3pm, I noticed...'
                        }
                        className="min-h-[120px] resize-none"
                    />
                </div>

                {/* Photo upload */}
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
