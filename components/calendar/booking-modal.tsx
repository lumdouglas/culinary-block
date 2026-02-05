"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { bookingSchema, BookingFormValues } from "@/lib/validations/booking"
import { createBooking } from "@/app/actions/bookings"
import { Kitchen } from "@/types/database"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export function BookingForm({ kitchens }: { kitchens: Kitchen[] }) {
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
  })

  async function onSubmit(values: BookingFormValues) {
    const result = await createBooking(values)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Kitchen reserved!")
      form.reset()
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="kitchen_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Kitchen</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a kitchen" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {kitchens.map((kitchen) => (
                    <SelectItem key={kitchen.id} value={kitchen.id}>
                      {kitchen.name} (${kitchen.hourly_rate}/hr)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <Input type="datetime-local" {...field} 
                  onChange={(e) => field.onChange(e.target.value)} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <Input type="datetime-local" {...field} 
                  onChange={(e) => field.onChange(e.target.value)} />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full">Confirm Booking</Button>
      </form>
    </Form>
  )
}