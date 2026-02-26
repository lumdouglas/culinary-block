"use client"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { useState } from "react";

const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

export default function ForgotPasswordPage() {
    const supabase = createClient();
    const [isSubmitted, setIsSubmitted] = useState(false);

    const form = useForm<z.infer<typeof forgotPasswordSchema>>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: "" }
    });

    async function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
                redirectTo: `${window.location.origin}/account-setup`,
            });

            if (error) {
                toast.error(error.message);
                return;
            }

            setIsSubmitted(true);
            toast.success("Password reset instructions sent!");
        } catch (e) {
            toast.error("An unexpected application error occurred.");
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
                <div className="w-full max-w-md space-y-8 rounded-xl border bg-white p-8 shadow-sm">
                    <div>
                        <h2 className="text-center text-3xl font-bold tracking-tight">Reset Password</h2>
                        <p className="mt-2 text-center text-sm text-slate-600">
                            Enter your email to receive recovery instructions
                        </p>
                    </div>

                    {isSubmitted ? (
                        <div className="space-y-4 text-center">
                            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-sm">
                                Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
                            </div>
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/login">Return to Login</Link>
                            </Button>
                        </div>
                    ) : (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField control={form.control} name="email" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl><Input placeholder="chef@example.com" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? "Sending..." : "Send Reset Link"}
                                </Button>
                                <div className="text-center mt-4">
                                    <Link href="/login" className="text-sm text-teal-600 hover:underline">
                                        Back to Login
                                    </Link>
                                </div>
                            </form>
                        </Form>
                    )}
                </div>
            </div>
        </div>
    );
}
