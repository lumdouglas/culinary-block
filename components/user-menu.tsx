"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, Settings, Calendar, ClipboardList } from 'lucide-react'
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
        const getUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser()

            if (authUser) {
                // Fetch profile to get role
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', authUser.id)
                    .single()

                setUser({
                    email: authUser.email || '',
                    name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
                    role: profile?.role
                })
            }
            setLoading(false)
        }
        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                // Fetch profile to get role
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single()

                setUser({
                    email: session.user.email || '',
                    name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                    role: profile?.role
                })
            } else {
                setUser(null)
            }
        })

        return () => subscription.unsubscribe()
    }, [supabase])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    if (loading) {
        return (
            <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse" />
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
