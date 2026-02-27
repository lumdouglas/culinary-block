'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createRequest, type RequestType } from '@/app/actions/requests'
import { createTicket } from '@/app/actions/maintenance'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Wrench, AlertTriangle, Camera, Send, Loader2, MessageCircleQuestion } from 'lucide-react'

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

// General question sub-types
const QUESTION_TYPES = [
    { value: 'question', label: 'General Question' },
    { value: 'request', label: 'Request' },
    { value: 'recommendation', label: 'Recommendation / Feedback' },
]

interface Kitchen {
    id: string
    name: string
}

type ActiveTab = RequestType

export function RequestForm({ kitchens }: { kitchens: Kitchen[] }) {
    const [activeTab, setActiveTab] = useState<ActiveTab>('maintenance')
    const [selectedRule, setSelectedRule] = useState<string>('')
    const [questionType, setQuestionType] = useState<string>('question')
    const [kitchenId, setKitchenId] = useState<string>('')
    const [priority, setPriority] = useState<string>('medium')
    const [isPending, startTransition] = useTransition()

    const resetForm = () => {
        const form = document.getElementById('request-form') as HTMLFormElement
        form?.reset()
        setSelectedRule('')
        setKitchenId('')
        setPriority('medium')
        setQuestionType('question')
    }

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            if (activeTab === 'maintenance') {
                const ticketData = new FormData()
                ticketData.set('title', formData.get('title') as string)
                ticketData.set('description', formData.get('description') as string)
                ticketData.set('priority', priority || 'medium')
                if (kitchenId && kitchenId !== 'general') {
                    ticketData.set('kitchen_id', kitchenId)
                }
                const photoFile = formData.get('photo') as File | null
                if (photoFile && photoFile.size > 0) {
                    ticketData.set('photo', photoFile)
                }

                const result = await createTicket(null, ticketData)
                if (result.error) {
                    toast.error(result.error)
                } else {
                    toast.success('Maintenance ticket submitted successfully!')
                    resetForm()
                }

            } else if (activeTab === 'rule_violation') {
                formData.set('type', 'rule_violation')
                if (selectedRule) {
                    const desc = formData.get('description') as string
                    formData.set('description', `Rule: ${selectedRule}\n\n${desc}`)
                }
                const result = await createRequest(formData)
                if (result.error) {
                    toast.error(result.error)
                } else {
                    toast.success('Request submitted successfully!')
                    resetForm()
                }

            } else {
                // General question / request / recommendation
                const subject = formData.get('subject') as string
                const message = formData.get('message') as string
                formData.set('type', 'general_question')
                formData.set('description', `[${QUESTION_TYPES.find(t => t.value === questionType)?.label ?? questionType}]\n\nSubject: ${subject}\n\n${message}`)

                const result = await createRequest(formData)
                if (result.error) {
                    toast.error(result.error)
                } else {
                    toast.success("Message sent! We'll get back to you soon.")
                    resetForm()
                }
            }
        })
    }

    // Tab config
    const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; activeClass: string }[] = [
        {
            id: 'maintenance',
            label: 'Maintenance Request',
            icon: <Wrench className="h-4 w-4 shrink-0" />,
            activeClass: 'bg-teal-50 text-teal-700 border-b-2 border-teal-600',
        },
        {
            id: 'rule_violation',
            label: 'Report Rule Violation',
            icon: <AlertTriangle className="h-4 w-4 shrink-0" />,
            activeClass: 'bg-amber-50 text-amber-700 border-b-2 border-amber-600',
        },
        {
            id: 'general_question',
            label: 'General Question',
            icon: <MessageCircleQuestion className="h-4 w-4 shrink-0" />,
            activeClass: 'bg-blue-50 text-blue-700 border-b-2 border-blue-600',
        },
    ]

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 min-w-max px-4 py-4 text-sm text-center font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === tab.id
                            ? tab.activeClass
                            : 'text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Form */}
            <form id="request-form" action={handleSubmit} className="p-6 space-y-5">

                {/* ── MAINTENANCE FIELDS ── */}
                {activeTab === 'maintenance' && (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" required placeholder="e.g., Oven not heating in Hood 1L" />
                        </div>

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

                {/* ── GENERAL QUESTION / REQUEST / RECOMMENDATION FIELDS ── */}
                {activeTab === 'general_question' && (
                    <>
                        <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700">
                            Have a question, need something from management, or want to share feedback? Send us a message below.
                        </div>

                        {/* Question type selector */}
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <div className="flex gap-2 flex-wrap">
                                {QUESTION_TYPES.map((qt) => (
                                    <button
                                        key={qt.value}
                                        type="button"
                                        onClick={() => setQuestionType(qt.value)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${questionType === qt.value
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                                            }`}
                                    >
                                        {qt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Subject */}
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                                id="subject"
                                name="subject"
                                required
                                placeholder={
                                    questionType === 'question' ? 'e.g., What are the kitchen hours on holidays?' :
                                        questionType === 'request' ? 'e.g., Request for additional storage shelf' :
                                            'e.g., Suggestion for better ventilation in Station 2'
                                }
                            />
                        </div>

                        {/* Message */}
                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                id="message"
                                name="message"
                                required
                                placeholder={
                                    questionType === 'question' ? 'Describe your question in detail...' :
                                        questionType === 'request' ? 'Describe what you need and why...' :
                                            'Share your recommendation or feedback...'
                                }
                                className="min-h-[120px] resize-none"
                            />
                        </div>
                    </>
                )}

                {/* Photo upload — shown for maintenance and rule violation only */}
                {activeTab !== 'general_question' && (
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
                )}

                {/* Submit */}
                <Button
                    type="submit"
                    className={`w-full h-12 text-lg text-white ${activeTab === 'maintenance'
                        ? 'bg-teal-600 hover:bg-teal-700'
                        : activeTab === 'rule_violation'
                            ? 'bg-amber-600 hover:bg-amber-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    disabled={isPending}
                >
                    {isPending ? (
                        <Loader2 className="animate-spin mr-2" />
                    ) : (
                        <Send className="mr-2 h-5 w-5" />
                    )}
                    {isPending
                        ? 'Submitting...'
                        : activeTab === 'general_question'
                            ? 'Send Message'
                            : 'Submit Request'
                    }
                </Button>
            </form>
        </div>
    )
}
