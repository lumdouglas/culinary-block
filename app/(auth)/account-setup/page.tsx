"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const accountSetupSchema = z.object({
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^a-zA-Z0-9]/, "Password must contain at least one symbol"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export default function AccountSetupPage() {
    const router = useRouter();
    const supabase = createClient();
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Use onAuthStateChange to properly handle hash fragments as Supabase establishes the session
    useEffect(() => {
        let active = true;

        async function checkSession() {
            const { data: { session } } = await supabase.auth.getSession();
            if (session && active) {
                setCheckingAuth(false);
            }
        }
        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && active) {
                setCheckingAuth(false);
            }
        });

        // Timeout safety net just in case the hash was totally invalid
        const timeout = setTimeout(() => {
            if (active && checkingAuth) {
                toast.error("Invalid or expired invite link. Please log in or request a new invite.");
                router.push("/login");
            }
        }, 4000);

        return () => {
            active = false;
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, [router, supabase.auth, checkingAuth]);

    const form = useForm<z.infer<typeof accountSetupSchema>>({
        resolver: zodResolver(accountSetupSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        }
    });

    async function onSubmit(values: z.infer<typeof accountSetupSchema>) {
        const { error } = await supabase.auth.updateUser({
            password: values.password
        });

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Password set successfully!");
            // Send them to complete their account profile
            router.push("/account-setup/profile");
            router.refresh();
        }
    }

    if (checkingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin mb-4" />
                    <p className="text-slate-500 text-sm font-medium">Verifying secure link...</p>
                    <p className="text-slate-400 text-xs mt-1">This may take a second</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
                <div className="w-full max-w-md space-y-8 rounded-xl border bg-white p-8 shadow-sm">
                    <div>
                        <h2 className="text-center text-3xl font-bold tracking-tight">Set up your account</h2>
                        <p className="mt-2 text-center text-sm text-slate-600">
                            Welcome! Please create a secure password to complete your Culinary Block account setup.
                        </p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField control={form.control} name="password" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl><Input type="password" {...field} /></FormControl>
                                    <FormDescription>Must be at least 8 characters, and include a number and a symbol.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl><Input type="password" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? "Saving..." : "Save Password & Continue"}
                            </Button>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
}
