
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { createClient } from "@/utils/supabase/client"
import { Lock, KeyRound, Loader2 } from "lucide-react"

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^a-zA-Z0-9]/, "Password must contain at least one symbol"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
})

const pinSchema = z.object({
    currentPin: z.string().length(4, "Current PIN must be 4 digits").regex(/^\d+$/, "PIN must contain only numbers"),
    pin: z.string().length(4, "New PIN must be exactly 4 digits").regex(/^\d+$/, "PIN must contain only numbers"),
})

export function SecuritySettings() {
    const [savingPwd, setSavingPwd] = useState(false)
    const [savingPin, setSavingPin] = useState(false)
    const supabase = createClient()

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
    })

    const pinForm = useForm<z.infer<typeof pinSchema>>({
        resolver: zodResolver(pinSchema),
        defaultValues: { currentPin: "", pin: "" },
    })

    async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
        setSavingPwd(true)
        try {
            // First verify the current password
            const { data: { user } } = await supabase.auth.getUser()
            if (!user?.email) throw new Error("Not authenticated")

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: values.currentPassword,
            })
            if (signInError) {
                passwordForm.setError("currentPassword", { message: "Incorrect current password" })
                return
            }

            // Now update to the new password
            const { error } = await supabase.auth.updateUser({ password: values.password })
            if (error) throw error
            toast.success("Password updated successfully")
            passwordForm.reset()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update password")
        } finally {
            setSavingPwd(false)
        }
    }

    async function onPinSubmit(values: z.infer<typeof pinSchema>) {
        setSavingPin(true)
        try {
            const res = await fetch("/api/settings/update-pin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPin: values.currentPin, pin: values.pin }),
            })

            const data = await res.json()

            if (!res.ok) {
                if (res.status === 403) {
                    pinForm.setError("currentPin", { message: "Incorrect current PIN" })
                } else {
                    throw new Error(data.error || "Failed to update PIN")
                }
                return
            }

            toast.success("Kiosk PIN updated successfully")
            pinForm.reset()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update PIN")
        } finally {
            setSavingPin(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Password Section */}
            <div className="bg-white p-6 border rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-slate-100 rounded-lg">
                        <Lock className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">Login Password</h2>
                        <p className="text-sm text-slate-500">Update your account password</p>
                    </div>
                </div>

                <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
                        <FormField
                            control={passwordForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Enter your current password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={passwordForm.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={savingPwd}>
                            {savingPwd && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                        </Button>
                    </form>
                </Form>
            </div>

            {/* PIN Section */}
            <div className="bg-white p-6 border rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-slate-100 rounded-lg">
                        <KeyRound className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">Kiosk PIN</h2>
                        <p className="text-sm text-slate-500">Update the PIN used for clocking in/out</p>
                    </div>
                </div>

                <Form {...pinForm}>
                    <form onSubmit={pinForm.handleSubmit(onPinSubmit)} className="space-y-4 max-w-md">
                        <FormField
                            control={pinForm.control}
                            name="currentPin"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current PIN (4 digits)</FormLabel>
                                    <FormControl>
                                        <Input type="password" inputMode="numeric" maxLength={4} placeholder="Enter your current PIN" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={pinForm.control}
                            name="pin"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New PIN (4 digits)</FormLabel>
                                    <FormControl>
                                        <Input type="password" inputMode="numeric" maxLength={4} {...field} />
                                    </FormControl>
                                    <FormDescription>Enter a new 4-digit numeric PIN.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={savingPin}>
                            {savingPin && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update PIN
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    )
}
