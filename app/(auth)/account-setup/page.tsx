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
    const [authError, setAuthError] = useState<string | null>(null);

    useEffect(() => {
        let subscription: { unsubscribe: () => void } | null = null;

        async function init() {
            // Check immediately if we already have a session
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                // If it's a new password recovery or invite, they need to set a password
                setCheckingAuth(false);
                return;
            }

            // If no immediate session, wait for the auth listener to pick up
            // the implicit token from the URL hash or cookies
            const { data } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
                if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
                    if (currentSession) {
                        setCheckingAuth(false);
                    } else {
                        // Wait a short moment before failing, sometimes the event fires 
                        // before the session is fully committed to storage
                        setTimeout(() => {
                            if (!currentSession) {
                                setAuthError("Your invite link has expired or is invalid. Please contact your administrator.");
                                setCheckingAuth(false);
                            }
                        }, 1000);
                    }
                }
            });
            subscription = data.subscription;

            // Fallback timeout in case no event ever fires
            setTimeout(() => {
                setCheckingAuth(false);
            }, 5000);
        }

        init();

        return () => {
            if (subscription) subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const form = useForm<z.infer<typeof accountSetupSchema>>({
        resolver: zodResolver(accountSetupSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        }
    });

    async function onSubmit(values: z.infer<typeof accountSetupSchema>) {
        // Explicitly check for an active session to prevent "User from sub claim doesn't exist" errors
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            toast.error("Your invite session has expired. Please request a new link.");
            router.push("/login");
            return;
        }

        const { error } = await supabase.auth.updateUser({
            password: values.password
        });

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Password set! Let's finish your profile.");
            router.push("/account-setup/profile");
            router.refresh();
        }
    }

    if (checkingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin" />
                    <p className="text-slate-600 text-sm font-medium">Verifying your secure link...</p>
                    <p className="text-slate-400 text-xs">This may take a few seconds</p>
                </div>
            </div>
        )
    }

    if (authError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm text-center space-y-4">
                    <h2 className="text-xl font-bold text-red-600">Invite Link Error</h2>
                    <p className="text-slate-600 text-sm">{authError}</p>
                    <Button variant="outline" onClick={() => router.push('/login')}>Go to Login</Button>
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
                                    <FormDescription>At least 8 characters, one number, and one symbol.</FormDescription>
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
