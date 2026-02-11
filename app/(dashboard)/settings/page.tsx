"use client"

import { useEffect, useState } from 'react'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { createClient } from '@/utils/supabase/client'
import { User, Building2, Phone, Mail, FileText, Bell, Save } from 'lucide-react'
import { SecuritySettings } from "@/components/settings/security-form"

const profileSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  contact_name: z.string().min(1, "Contact name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address"),
  business_type: z.string().optional(),
  business_description: z.string().optional(),
  notification_email: z.string().email("Invalid email").optional().or(z.literal('')),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      company_name: "",
      contact_name: "",
      phone: "",
      email: "",
      business_type: "",
      business_description: "",
      notification_email: "",
    }
  })

  // Load existing profile data
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        form.reset({
          company_name: profile.company_name || "",
          contact_name: profile.contact_name || "",
          phone: profile.phone || "",
          email: user.email || "",
          business_type: profile.business_type || "",
          business_description: profile.business_description || "",
          notification_email: profile.notification_email || user.email || "",
        })
      } else {
        form.reset({
          ...form.getValues(),
          email: user.email || "",
          notification_email: user.email || "",
        })
      }
      setLoading(false)
    }
    loadProfile()
  }, [supabase, form])

  async function onSubmit(values: ProfileFormValues) {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("You must be logged in to update your profile")
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          company_name: values.company_name,
          contact_name: values.contact_name,
          phone: values.phone,
          business_type: values.business_type,
          business_description: values.business_description,
          notification_email: values.notification_email,
        })
        .eq('id', user.id)

      if (error) {
        console.error('Update error:', error)
        toast.error("Failed to update profile")
      } else {
        toast.success("Profile updated successfully!")
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <div className="space-y-4">
          <div className="h-32 bg-slate-100 animate-pulse rounded-xl" />
          <div className="h-48 bg-slate-100 animate-pulse rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">Settings</h1>
      <p className="text-slate-700 mb-8">Manage your account and business information</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Business Information */}
          <div className="bg-white p-6 border rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Building2 className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Business Information</h2>
                <p className="text-sm text-slate-700">Your company details</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Business Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="business_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Bakery, Catering, Food Truck" {...field} />
                    </FormControl>
                    <FormDescription>What type of food business do you operate?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="business_description"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Business Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of your business, specialties, or products..."
                      className="resize-none h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Contact Information */}
          <div className="bg-white p-6 border rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 rounded-lg">
                <User className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Contact Information</h2>
                <p className="text-sm text-slate-700">How we can reach you</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Primary contact person" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Account Email</FormLabel>
                  <FormControl>
                    <Input type="email" disabled className="bg-slate-50" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is your login email and cannot be changed here.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Notification Preferences */}
          <div className="bg-white p-6 border rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Bell className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Notification Preferences</h2>
                <p className="text-sm text-slate-700">Where to send booking confirmations and alerts</p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notification_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notification Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="notifications@yourbusiness.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Booking confirmations and facility updates will be sent to this email. Leave blank to use your account email.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-slate-900 hover:bg-slate-800 px-8"
              size="lg"
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Security Settings */}
      <div className="mt-8 pt-8 border-t">
        <h2 className="text-xl font-bold mb-6">Security</h2>
        <div className="bg-slate-50 p-6 rounded-xl border mb-6">
          <p className="text-sm text-slate-700 mb-4">
            Manage your password and Kiosk PIN.
          </p>
          <SecuritySettings />
        </div>
      </div>
    </div>
  )
}