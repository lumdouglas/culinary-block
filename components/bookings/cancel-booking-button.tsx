"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cancelBooking } from "@/app/actions/bookings"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2, X } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface CancelBookingButtonProps {
    bookingId: string
}

export function CancelBookingButton({ bookingId }: CancelBookingButtonProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleCancel() {
        setLoading(true)
        try {
            const result = await cancelBooking(bookingId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Booking cancelled")
                router.refresh()
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 gap-1.5"
                    disabled={loading}
                >
                    {loading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <X className="w-3.5 h-3.5" />
                    )}
                    Cancel
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently cancel your reservation. You can rebook from the calendar if needed.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleCancel}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        Yes, Cancel It
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
