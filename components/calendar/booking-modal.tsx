"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createBooking, Station } from "@/app/actions/bookings"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { DialogClose } from "@/components/ui/dialog"

// Duration options in hours
const durationOptions = [
  { label: "30 minutes", value: 0.5 },
  { label: "1 hour", value: 1 },
  { label: "1.5 hours", value: 1.5 },
  { label: "2 hours", value: 2 },
  { label: "2.5 hours", value: 2.5 },
  { label: "3 hours", value: 3 },
  { label: "4 hours", value: 4 },
  { label: "5 hours", value: 5 },
  { label: "6 hours", value: 6 },
  { label: "8 hours", value: 8 },
  { label: "10 hours", value: 10 },
  { label: "12 hours", value: 12 },
]

const bookingFormSchema = z.object({
  station_id: z.string().min(1, "Please select a station"),
  date: z.string().min(1, "Please select a date"),
  start_time: z.string().min(1, "Please select a start time"),
  duration: z.string().min(1, "Please select a duration"),
  notes: z.string().optional(),
})

type BookingFormValues = z.infer<typeof bookingFormSchema>

interface BookingModalProps {
  stations: Station[]
  preselectedStation?: number
  preselectedDate?: Date
  preselectedStartTime?: string
  preselectedDuration?: string
  onSuccess?: () => void
}

export function BookingForm({
  stations,
  preselectedStation,
  preselectedDate,
  preselectedStartTime,
  preselectedDuration,
  onSuccess
}: BookingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Format date for input
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  // Max bookable date = 6 months from today
  const maxBookingDate = (() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 6)
    return formatDate(d)
  })()

  // Generate time slots (30-minute increments)
  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2)
    const minutes = (i % 2) * 30
    const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    const displayTime = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    return { value: time, label: displayTime }
  })

  const generalKitchen = stations.find(s => s.name === 'General Kitchen')

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      station_id: preselectedStation?.toString() || generalKitchen?.id.toString() || "",
      date: preselectedDate ? formatDate(preselectedDate) : formatDate(new Date()),
      start_time: preselectedStartTime || "09:00",
      duration: preselectedDuration || "1",
      notes: "",
    },
  })

  async function onSubmit(values: BookingFormValues) {
    setIsSubmitting(true)
    try {
      // Calculate start and end times
      const startDateTime = new Date(`${values.date}T${values.start_time}:00`)
      const durationHours = parseFloat(values.duration)
      const endDateTime = new Date(startDateTime.getTime() + durationHours * 60 * 60 * 1000)

      const result = await createBooking(
        parseInt(values.station_id),
        startDateTime.toISOString(),
        endDateTime.toISOString(),
        values.notes
      )

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Booking created successfully!")
        form.reset()
        onSuccess?.()
      }
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate end time for display
  const watchedValues = form.watch()
  const calculateEndTime = () => {
    if (watchedValues.date && watchedValues.start_time && watchedValues.duration) {
      const startDateTime = new Date(`${watchedValues.date}T${watchedValues.start_time}:00`)
      const durationHours = parseFloat(watchedValues.duration)
      const endDateTime = new Date(startDateTime.getTime() + durationHours * 60 * 60 * 1000)
      return endDateTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
    return '--'
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="station_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Station</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a station" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {stations.map((station) => (
                    <SelectItem key={station.id} value={station.id.toString()} title={station.equipment}>
                      {station.name} ({station.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  min={formatDate(new Date())}
                  max={maxBookingDate}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-60">
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {durationOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="bg-slate-100 rounded-lg p-3 text-sm">
          <span className="text-slate-500">End Time: </span>
          <span className="font-medium">{calculateEndTime()}</span>
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any special requirements or notes..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="flex-1">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700" disabled={isSubmitting}>
            {isSubmitting ? "Booking..." : "Confirm Booking"}
          </Button>
        </div>

        <p className="text-xs text-slate-400 text-center pt-1">
          Bookings are limited to 6 months in advance and one station at a time.{" "}
          <span className="text-slate-500 font-medium">Need more? Contact Culinary Block Management.</span>
        </p>
      </form>
    </Form>
  )
}