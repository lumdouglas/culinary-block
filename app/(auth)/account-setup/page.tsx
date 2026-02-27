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
        async function init() {
            try {
                // 1. Manually capture implicit tokens from URL hash (legacy magic links/invites fallback)
                const hash = typeof window !== 'undefined' ? window.location.hash : '';
                if (hash && hash.includes('access_token=')) {
                    console.log('AccountSetup: Found access_token in hash');
                    const cleanUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';
                    if (typeof window !== 'undefined') window.history.replaceState(null, '', cleanUrl);

                    const params = new URLSearchParams(hash.substring(1));
                    const access_token = params.get('access_token');
                    const refresh_token = params.get('refresh_token');

                    if (access_token && refresh_token) {
                        await supabase.auth.signOut({ scope: 'local' }).catch(() => { });
                        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
                        if (error) {
                            console.error('AccountSetup: setSession error:', error.message);
                            setAuthError(error.message);
                        } else {
                            console.log('AccountSetup: Session established from hash');
                        }
                        setCheckingAuth(false);
                        return;
                    }
                }

                // 2. Poll getSession() with retries — mobile browsers sometimes need a moment
                console.log('AccountSetup: Starting session polling...');
                const MAX_RETRIES = 12; // Increased retries for mobile
                const RETRY_DELAY_MS = 500; // Increased delay
                for (let i = 0; i < MAX_RETRIES; i++) {
                    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                    if (sessionError) {
                        console.error(`AccountSetup: getSession error (attempt ${i + 1}):`, sessionError.message);
                    }

                    if (session) {
                        console.log(`AccountSetup: Session found on attempt ${i + 1}`);
                        setCheckingAuth(false);
                        return;
                    }

                    if (i < MAX_RETRIES - 1) {
                        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                    }
                }

                // 3. Still no session after retries — show error
                console.error('AccountSetup: No session found after all retries');
                setAuthError("Your secure link could not be verified. Please try logging in or requested a new invite.");
                setCheckingAuth(false);
            } catch (err: any) {
                console.error('AccountSetup: Internal error during init:', err);
                setAuthError(`An unexpected error occurred: ${err.message || 'Unknown error'}`);
                setCheckingAuth(false);
            }
        }

        init();
    }, [supabase, router]);

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
            // If the user's auth record was deleted but their browser still has an active JWT,
            // Supabase throws this error. We must explicitly clear their stale local session.
            if (error.message.includes("User from sub claim in JWT does not exist")) {
                await supabase.auth.signOut({ scope: 'local' }).catch(() => { });
                toast.error("Your account session is invalid or has been removed. Please ask for a new invite.");
                router.push("/login");
            } else {
                toast.error(error.message);
            }
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
