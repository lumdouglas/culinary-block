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
        let cancelled = false;

        async function init() {
            // Parse hash params — invite links using implicit flow land here with #access_token=...
            const hashParams = typeof window !== 'undefined' && window.location.hash
                ? Object.fromEntries(new URLSearchParams(window.location.hash.slice(1)))
                : {};

            // Hash contains an explicit error (e.g. expired link)
            if (hashParams.error || hashParams.error_description) {
                if (!cancelled) router.push(`/login?error=${encodeURIComponent(hashParams.error_description || hashParams.error || 'Link expired')}`);
                return;
            }

            // Hash contains implicit-flow tokens — manually set session.
            // createBrowserClient uses flowType:"pkce" which throws during URL auto-detection
            // for implicit tokens, but setSession() bypasses that restriction and works directly.
            if (hashParams.access_token && hashParams.refresh_token) {
                const { data: { session }, error } = await supabase.auth.setSession({
                    access_token: hashParams.access_token,
                    refresh_token: hashParams.refresh_token,
                });
                if (cancelled) return;
                if (session) {
                    window.history.replaceState(null, '', window.location.pathname);
                    setCheckingAuth(false);
                    return;
                }
                // setSession failed — show the error so the user can report it
                console.error('[account-setup] setSession failed:', error);
                setAuthError(`Could not verify your invite link: ${error?.message ?? 'unknown error'}. Please contact your administrator to request a new invite.`);
                setCheckingAuth(false);
                return;
            }

            // No hash tokens — look for a session established via cookie (the callback route
            // exchanges token_hash / code server-side and sets cookies before redirecting here).
            //
            // We subscribe to onAuthStateChange and wait for INITIAL_SESSION, which fires after
            // _recoverAndRefresh() completes. This avoids a race where getSession() returns null
            // because the client hasn't finished reading cookies yet.
            const hasSession = await new Promise<boolean>((resolve) => {
                // Short-circuit: if getSession already has the answer, don't wait for the event
                supabase.auth.getSession().then(({ data: { session } }) => {
                    if (session) resolve(true);
                });

                const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                    // INITIAL_SESSION fires when the client restores a session from cookies.
                    // SIGNED_IN / USER_UPDATED fire when a session is newly established.
                    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                        subscription.unsubscribe();
                        resolve(!!session);
                    }
                });

                // Fallback after 4 seconds if no auth event arrives
                setTimeout(() => resolve(false), 4000);
            });

            if (cancelled) return;

            if (hasSession) {
                setCheckingAuth(false);
            } else {
                router.push('/login?error=Your+invite+link+has+expired+or+is+invalid.+Please+contact+your+administrator.');
            }
        }

        init();

        return () => { cancelled = true; };
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
