"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { hash } from "bcrypt-ts";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const profileSetupSchema = z.object({
    company_name: z.string().min(2, "Company Name is required"),
    phone: z.string().min(10, "Valid phone number is required"),
    kiosk_pin: z.string().length(4, "Kiosk PIN must be exactly 4 digits").regex(/^\d+$/, "PIN must contain only numbers"),
    address: z.string().optional()
});

export default function ProfileSetupPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    const form = useForm<z.infer<typeof profileSetupSchema>>({
        resolver: zodResolver(profileSetupSchema),
        defaultValues: {
            company_name: "",
            phone: "",
            kiosk_pin: "",
            address: ""
        }
    });

    // Verify session and pre-fill any existing data
    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("Session expired. Please log in again.");
                router.push("/login");
                return;
            }

            setUserId(user.id);

            const { data: profile } = await supabase
                .from('profiles')
                .select('company_name, phone')
                .eq('id', user.id)
                .single();

            if (profile) {
                form.reset({
                    company_name: profile.company_name || "",
                    phone: profile.phone || "",
                    kiosk_pin: "",
                    address: ""
                });
            }

            setLoadingInitial(false);
        }
        loadProfile();
    }, [router, supabase, form]);

    async function onSubmit(values: z.infer<typeof profileSetupSchema>) {
        if (!userId) return;

        const pinHash = await hash(values.kiosk_pin, 10);

        const { error } = await supabase
            .from('profiles')
            .update({
                company_name: values.company_name,
                phone: values.phone,
                kiosk_pin_hash: pinHash,
                address: values.address || null,
            })
            .eq('id', userId);

        if (error) {
            toast.error(error.message || "Failed to save profile");
        } else {
            toast.success("Profile completed successfully!");
            router.push("/calendar");
            router.refresh();
        }
    }

    if (loadingInitial) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin mb-4" />
                    <p className="text-slate-500">Loading your profile...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
                <div className="w-full max-w-lg space-y-8 rounded-xl border bg-white p-8 shadow-sm">
                    <div>
                        <h2 className="text-center text-3xl font-bold tracking-tight">Complete your profile</h2>
                        <p className="mt-2 text-center text-sm text-slate-600">
                            Almost done! We need a few more details to finalize your account setup.
                        </p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField control={form.control} name="company_name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Company Name</FormLabel>
                                    <FormControl><Input placeholder="Culinary Creators LLC" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl><Input placeholder="408-555-0123" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="kiosk_pin" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Timesheet Kiosk PIN</FormLabel>
                                    <FormControl>
                                        <Input placeholder="1234" maxLength={4} type="tel" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        We recommend using the last 4 digits of your phone number. You'll use this to clock in at the facility.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="address" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Business Address <span className="text-slate-400 font-normal">(Optional)</span></FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="123 Main St&#10;San Jose, CA 95133"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <Button type="submit" className="w-full mt-6" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? "Saving..." : "Complete Setup"}
                            </Button>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
}
