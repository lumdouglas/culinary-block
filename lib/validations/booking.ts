import { z } from "zod";

const validDate = z.date().refine(
  (d) => !isNaN(d.getTime()),
  { message: "Please enter a valid date and time" }
);

export const bookingSchema = z
  .object({
    kitchen_id: z.string().min(1, { message: "Please select a kitchen" }),
    start_time: validDate.min(new Date(), {
      message: "Start time cannot be in the past",
    }),
    end_time: validDate,
  })
  .refine((data) => data.end_time > data.start_time, {
    message: "End time must be after start time",
    path: ["end_time"],
  });

// Keep your existing type export
export type BookingFormValues = z.infer<typeof bookingSchema>;