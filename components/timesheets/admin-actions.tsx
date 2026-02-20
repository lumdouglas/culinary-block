
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Check, X, Loader2 } from "lucide-react"

interface RequestActionProps {
    requestId: string
    status: 'approved' | 'rejected'
}

export function RequestActionDialog({ requestId, status }: RequestActionProps) {
    const [open, setOpen] = useState(false)
    const [notes, setNotes] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const isApprove = status === 'approved'

    async function handleAction() {
        setLoading(true)
        try {
            const response = await fetch(`/api/admin/timesheets/requests/${requestId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, resolutionNotes: notes }),
            })

            if (!response.ok) {
                throw new Error("Failed to process request")
            }

            toast.success(`Request ${status} successfully`)
            setOpen(false)
            router.refresh()
        } catch {
            toast.error("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant={isApprove ? "outline" : "ghost"}
                    size="sm"
                    className={isApprove ? "text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200" : "text-red-600 hover:text-red-700 hover:bg-red-50"}
                >
                    {isApprove ? <Check className="h-4 w-4 mr-1" /> : <X className="h-4 w-4 mr-1" />}
                    {isApprove ? "Approve" : "Reject"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isApprove ? "Approve Request" : "Reject Request"}</DialogTitle>
                    <DialogDescription>
                        {isApprove
                            ? "This will apply the requested changes to the timesheet."
                            : "This will decline the request without changing data."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Textarea
                        placeholder="Optional notes..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        variant={isApprove ? "default" : "destructive"}
                        onClick={handleAction}
                        disabled={loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm {isApprove ? "Approval" : "Rejection"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
