"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";


import { submitApplication } from "@/app/actions/application";

const applySchema = z.object({
  // Company Information
  company_name: z.string().min(1, "Company/DBA name is required").min(2, "Must be at least 2 characters"),
  address: z.string().min(1, "Address is required").min(5, "Address must be at least 5 characters"),

  // Main Contact
  contact_first_name: z.string().min(1, "First name is required"),
  contact_last_name: z.string().min(1, "Last name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  phone: z.string().min(1, "Phone number is required").min(10, "Phone number must be at least 10 characters"),

  // Business Details
  website: z.string().optional(),
  years_in_operation: z.string().optional(),
  social_media: z.string().optional(),
  cuisine_type: z.string().min(1, "Cuisine type is required").min(2, "Must be at least 2 characters"),

  // Operational Requirements
  kitchen_use_description: z.string().min(1, "Kitchen use description is required").min(10, "Description must be at least 10 characters long"),
  usage_hours: z.string().min(1, "Usage hours/days are required").min(5, "Must be at least 5 characters long"),
  equipment_needed: z.string().min(1, "Equipment list is required").min(5, "Must be at least 5 characters long"),
});

export default function ApplicationPage() {
  const form = useForm<z.infer<typeof applySchema>>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      company_name: "",
      address: "",
      contact_first_name: "",
      contact_last_name: "",
      email: "",
      phone: "",
      website: "",
      years_in_operation: "",
      social_media: "",
      cuisine_type: "",
      kitchen_use_description: "",
      usage_hours: "",
      equipment_needed: "",
    },
  });

  async function onSubmit(values: z.infer<typeof applySchema>) {
    const result = await submitApplication(values);

    if (result.error) {
      toast.error(result.error);
    } else {
      if (result.emailError) {
        toast.warning(result.emailError);
      } else {
        toast.success("Application submitted successfully!");
      }
      form.reset();
      // Redirect to thank you page
      window.location.href = '/apply/thank-you';
    }
  }

  function onError(errors: any) {
    console.error('Validation errors:', errors);
    toast.error("Please fill out all required fields correctly.");

    setTimeout(() => {
      const firstError = document.querySelector('[role="alert"], .text-red-500, .text-destructive');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold">Book a Tour / Apply for Kitchen Space</h1>
          <p className="text-slate-500 mt-2">Tell us about your business and kitchen needs</p>

          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-5 text-left flex gap-4 max-w-3xl mx-auto">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">Waitlist Information</h3>
              <p className="text-amber-800 text-sm leading-relaxed">
                Thank you for your interest! We are currently operating at or near capacity and are maintaining a waitlist for when space opens up (typically a 2-6 month wait). Please note our minimum requirement is $1,000/month, which covers your first 20 hours at $50/hr (rates drop for additional hours via our timesheet billing).
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-8 bg-white p-8 border rounded-2xl">

              {/* Company Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">Company Information</h2>

                <FormField control={form.control} name="company_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900">Company/DBA Name *</FormLabel>
                    <FormControl><Input placeholder="Boulangerie Co." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900">Address *</FormLabel>
                    <FormControl><Input placeholder="123 Main St, San Jose, CA 95133" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Main Contact */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">Main Contact</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="contact_first_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-900">First Name *</FormLabel>
                      <FormControl><Input placeholder="Jane" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="contact_last_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-900">Last Name *</FormLabel>
                      <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900">Email *</FormLabel>
                    <FormControl><Input type="email" placeholder="jane@boulangerie.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900">Phone *</FormLabel>
                    <FormControl><Input placeholder="(555) 123-4567" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Business Details */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">Business Details</h2>

                <FormField control={form.control} name="website" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900">Website</FormLabel>
                    <FormControl><Input placeholder="https://boulangerie.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="years_in_operation" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-900">Years in Operation</FormLabel>
                      <FormControl><Input placeholder="3 years" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="social_media" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-900">Social Media (Facebook/Instagram)</FormLabel>
                      <FormControl><Input placeholder="@boulangerie" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="cuisine_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900">What type of cuisine will you be making? *</FormLabel>
                    <FormControl><Input placeholder="French pastries and breads" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Operational Requirements */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">Operational Requirements</h2>

                <FormField control={form.control} name="kitchen_use_description" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900">Describe your general kitchen use *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="We prepare fresh croissants and baguettes daily. Need space for dough preparation, proofing, and baking..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="usage_hours" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900">Approximate hours and day/time usage *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Monday-Friday, 3am-10am. Weekends as needed for special orders..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="equipment_needed" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900">Equipment used for your food operation *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Rack oven, commercial mixer, proofing cabinet, prep tables, walk-in cooler..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg py-6">
                Submit Application
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}