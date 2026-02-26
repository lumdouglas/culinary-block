"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, Settings, Calendar, ClipboardList, Receipt, Wrench } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from 'next/link'

interface UserSession {
    email: string
    name?: string
    role?: string
}

export function UserMenu() {
    const [user, setUser] = useState<UserSession | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        let isMounted = true;

        // Failsafe timeout: if Supabase hangs indefinitely on a zombie token refresh,
        // force the UI out of the loading state so the user isn't trapped.
        const timeoutId = setTimeout(() => {
            if (isMounted && loading) {
                setLoading(false);
            }
        }, 1500);

        const getUser = async () => {
            try {
                const { data: { user: authUser }, error } = await supabase.auth.getUser()

                if (error || !authUser) {
                    if (isMounted) setUser(null);
                    return; // Explicitly stop execution to avoid malformed DB queries
                }

                // Fetch profile to get role ONLY if we have a valid, active user ID
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', authUser.id)
                    .single()

                if (isMounted) {
                    setUser({
                        email: authUser.email || '',
                        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
                        role: profile?.role
                    })
                }

            } catch (err) {
                // Silently devour errors so we don't crash the Next.js layout 
                // and trigger an AbortError during hydration or active routing
                console.error("UserMenu session fetch silently failed:", err);
                if (isMounted) setUser(null);
            } finally {
                if (isMounted) setLoading(false)
            }
        }
        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user?.id) {
                // Fire and forget: Do NOT await this inside the listener callback.
                // Supabase GoTrue internally awaits all listeners; if we block here, 
                // signInWithPassword will hang indefinitely on the login page.
                (async () => {
                    try {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('role')
                            .eq('id', session.user.id)
                            .single()

                        if (isMounted) {
                            setUser({
                                email: session.user.email || '',
                                name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                                role: profile?.role
                            })
                        }
                    } catch (err) {
                        console.error("UserMenu Listener Error:", err)
                        if (isMounted) setUser(null)
                    }
                })();
            } else {
                if (isMounted) setUser(null)
            }
        })

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        }
    }, [supabase])

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut({ scope: 'local' })
        } catch (e) { console.error(e) }
        router.push('/')
        router.refresh()
    }

    if (loading) {
        return (
            <button
                onClick={handleSignOut}
                title="Click to Force Sign Out"
                className="w-9 h-9 rounded-full bg-slate-200 animate-pulse hover:bg-red-200 focus:outline-none transition-colors border-2 border-transparent hover:border-red-400"
            />
        )
    }

    if (!user) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/login')}
                className="border-slate-600 text-slate-600 hover:bg-slate-50"
            >
                Tenant Login
            </Button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-auto py-1.5 px-2 hover:bg-slate-100">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white font-semibold shadow-sm">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium text-slate-700">
                        {user.name}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white shadow-lg border border-slate-200">
                <DropdownMenuLabel className="py-3">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                        {user.role === 'admin' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800 w-fit">
                                Admin
                            </span>
                        )}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {user.role === 'admin' && (
                    <>
                        <DropdownMenuItem asChild className="cursor-pointer py-2">
                            <Link href="/admin/requests" className="flex items-center">
                                <ClipboardList className="mr-2 h-4 w-4 text-teal-600" />
                                <span className="text-teal-900 font-medium">Maintenance Requests</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer py-2">
                            <Link href="/admin/applications" className="flex items-center">
                                <ClipboardList className="mr-2 h-4 w-4 text-teal-600" />
                                <span className="text-teal-900 font-medium">Applications</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer py-2">
                            <Link href="/admin/timesheets" className="flex items-center">
                                <ClipboardList className="mr-2 h-4 w-4 text-teal-600" />
                                <span className="text-teal-900 font-medium">Timesheets</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer py-2">
                            <Link href="/billing/invoices" className="flex items-center">
                                <ClipboardList className="mr-2 h-4 w-4 text-teal-600" />
                                <span className="text-teal-900 font-medium">All Invoices</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}

                <DropdownMenuItem asChild className="cursor-pointer py-2">
                    <Link href="/calendar" className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-slate-500" />
                        <span>My Bookings</span>
                    </Link>
                </DropdownMenuItem>
                {user.role !== 'admin' && (
                    <>
                        <DropdownMenuItem asChild className="cursor-pointer py-2">
                            <Link href="/billing/invoices" className="flex items-center">
                                <Receipt className="mr-2 h-4 w-4 text-slate-500" />
                                <span>My Billing</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer py-2">
                            <Link href="/maintenance" className="flex items-center">
                                <Wrench className="mr-2 h-4 w-4 text-slate-500" />
                                <span>Maintenance</span>
                            </Link>
                        </DropdownMenuItem>
                    </>
                )}
                <DropdownMenuItem asChild className="cursor-pointer py-2">
                    <Link href="/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4 text-slate-500" />
                        <span>Settings</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-600 cursor-pointer py-2 focus:text-red-600 focus:bg-red-50"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
