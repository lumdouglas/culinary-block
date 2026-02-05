"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { updateKioskPin } from "@/app/actions/settings";

const pinSchema = z.object({
  pin: z.string().length(4, "PIN must be exactly 4 digits").regex(/^\d+$/, "Only numbers allowed"),
  confirmPin: z.string()
}).refine((data) => data.pin === data.confirmPin, {
  message: "PINs do not match",
  path: ["confirmPin"],
});

export default function SettingsPage() {
  const form = useForm<z.infer<typeof pinSchema>>({
    resolver: zodResolver(pinSchema),
    defaultValues: { pin: "", confirmPin: "" }
  });

  async function onSubmit(values: z.infer<typeof pinSchema>) {
    const result = await updateKioskPin(values.pin);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Kiosk PIN updated successfully!");
      form.reset();
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="bg-white p-6 border rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Kiosk Security</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New 4-Digit PIN</FormLabel>
                  <FormControl>
                    <Input type="password" maxLength={4} placeholder="****" {...field} />
                  </FormControl>
                  <FormDescription>This PIN is used to clock in at the kitchen terminal.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm PIN</FormLabel>
                  <FormControl>
                    <Input type="password" maxLength={4} placeholder="****" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Updating..." : "Update PIN"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}