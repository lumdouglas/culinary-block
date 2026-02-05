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

// Helper to format Date objects for the datetime-local input
const formatDateForInput = (date: Date) => {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

export function BookingForm({ kitchens }: { kitchens: Kitchen[] }) {
  // Use the type directly from the schema to ensure 100% alignment
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      kitchen_id: "",
      start_time: new Date(),
      end_time: new Date(Date.now() + 3600000),
    },
    // Adding this mode ensures validation triggers correctly on change
    mode: "onChange", 
  });

  async function onSubmit(values: BookingFormValues) {
    try {
      const result = await createBooking(values);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Booking created successfully!");
        // Optional: close modal or refresh
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
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
                <FormControl>
                  <Input 
                    type="datetime-local" 
                    // Convert Date -> String for HTML Input
                    value={field.value instanceof Date ? formatDateForInput(field.value) : field.value}
                    // Convert String -> Date for Form State
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
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
                <FormControl>
                  <Input 
                    type="datetime-local" 
                    value={field.value instanceof Date ? formatDateForInput(field.value) : field.value}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating..." : "Confirm Booking"}
        </Button>
      </form>
    </Form>
  )
}