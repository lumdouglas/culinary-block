"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

const applySchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  company_name: z.string().min(2, "Company name is required"),
});

export default function ApplicationPage() {
  const supabase = createClient();
  const form = useForm<z.infer<typeof applySchema>>({
    resolver: zodResolver(applySchema),
  });

  async function onSubmit(values: z.infer<typeof applySchema>) {
    const { error } = await supabase.from('applications').insert([values]);
    if (error) {
      toast.error("Submission failed. Please try again.");
    } else {
      toast.success("Application submitted! We will reach out soon.");
      form.reset();
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold">Join the Kitchen</h1>
        <p className="text-slate-500 mt-2">Apply for a station at Culinary Block</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 border rounded-2xl">
          <FormField control={form.control} name="company_name" render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl><Input placeholder="Boulangerie Co." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Name</FormLabel>
                <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Email</FormLabel>
                <FormControl><Input type="email" placeholder="jane@boulangerie.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
            Submit Application
          </Button>
        </form>
      </Form>
    </div>
  );
}