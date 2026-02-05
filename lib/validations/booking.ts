import * as z from "zod";

export const bookingSchema = z.object({
  kitchen_id: z.string({
    required_error: "Please select a kitchen",
  }).uuid(),
  
  start_time: z.coerce.date({
    required_error: "Start time is required",
    invalid_type_error: "That's not a valid date",
  }),
  
  end_time: z.coerce.date({
    required_error: "End time is required",
    invalid_type_error: "That's not a valid date",
  }),
  
  rrule: z.string().optional(),
}).refine((data) => data.end_time > data.start_time, {
  message: "End time must be after start time",
  path: ["end_time"],
});