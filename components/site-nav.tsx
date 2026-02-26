"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/user-menu"
import { createClient } from "@/utils/supabase/client"
import { Menu, X } from "lucide-react"

// Create client once outside component to prevent re-render loop
const supabase = createClient()

export function SiteNav() {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [userRole, setUserRole] = useState<'admin' | 'tenant' | null>(null)
    const pathname = usePathname()

    useEffect(() => {
        let isMounted = true;

        const checkAuth = async () => {
            try {
                const { data: { user }, error } = await supabase.auth.getUser()
                if (error || !user) {
                    if (isMounted) {
                        setIsLoggedIn(false)
                        setUserRole(null)
                    }
                    return;
                }

                if (isMounted) setIsLoggedIn(true)

                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
                if (isMounted) setUserRole(profile?.role || 'tenant')

            } catch (err) {
                console.error("SiteNav checkAuth error:", err)
                if (isMounted) {
                    setIsLoggedIn(false)
                    setUserRole(null)
                }
            }
        }
        checkAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (isMounted) setIsLoggedIn(!!session?.user)

            if (session?.user?.id) {
                // Fire and forget to prevent blocking Supabase's signInWithPassword promise
                (async () => {
                    try {
                        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
                        if (isMounted) setUserRole(profile?.role || 'tenant')
                    } catch (err) {
                        console.error("SiteNav listener error:", err)
                        if (isMounted) setUserRole(null)
                    }
                })();
            } else {
                if (isMounted) setUserRole(null)
            }
        })

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        }
    }, [])

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [pathname])
    return (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 shadow-sm">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* Logo - Reduced size by ~50% */}
                    <Link href="/" className="flex items-center">
                        <Image
                            src="/logo.png"
                            alt="Culinary Block - Kitchen Rental Facilities"
                            width={400} // Reduced width
                            height={100} // Reduced height
                            className="h-8 w-auto object-contain sm:h-10 md:h-12" // Smaller height classes
                            priority
                        />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-1">
                        <NavLink href="/">HOME</NavLink>
                        {isLoggedIn && (
                            <>
                                <NavLink href="/calendar">DASHBOARD</NavLink>
                                <NavLink href="/contact">CONTACT</NavLink>
                            </>
                        )}
                        {!isLoggedIn && (
                            <Link href="/apply" className="ml-2">
                                <Button className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 shadow-md hover:shadow-lg transition-all">
                                    APPLY NOW
                                </Button>
                            </Link>
                        )}
                        <div className="ml-3 pl-3 border-l border-slate-200">
                            <UserMenu />
                        </div>
                    </nav>

                    {/* Mobile Menu Toggle */}
                    <div className="lg:hidden flex items-center gap-2">
                        <div className="hidden">
                            <UserMenu />
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 text-slate-600 hover:text-slate-900 focus:outline-none"
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            {isMobileMenuOpen && (
                <div className="absolute right-4 top-16 z-50 w-64 bg-white rounded-lg shadow-xl border border-slate-100 p-2 lg:hidden">
                    <div className="flex flex-col space-y-1">
                        <MobileNavLink href="/">HOME</MobileNavLink>
                        {isLoggedIn && (
                            <>
                                <MobileNavLink href="/calendar">DASHBOARD</MobileNavLink>
                                <MobileNavLink href="/contact">CONTACT</MobileNavLink>
                                <div className="py-2 border-t border-slate-100 my-2">
                                    <p className="px-3 text-xs font-semibold text-slate-500 mb-1">ACCOUNT</p>
                                    <MobileNavLink href="/settings">Settings</MobileNavLink>

                                    {userRole === 'admin' ? (
                                        <>
                                            <MobileNavLink href="/admin/tenants">Active Tenants</MobileNavLink>
                                            <MobileNavLink href="/admin/applications">Applications</MobileNavLink>
                                            <MobileNavLink href="/admin/requests">Tenant Requests</MobileNavLink>
                                            <MobileNavLink href="/admin/timesheets">Timesheet Log</MobileNavLink>
                                            <MobileNavLink href="/billing/invoices">All Invoices</MobileNavLink>
                                            <MobileNavLink href="/kiosk">Kiosk Setup</MobileNavLink>
                                        </>
                                    ) : (
                                        <>
                                            <MobileNavLink href="/timesheets">My Timesheets</MobileNavLink>
                                            <MobileNavLink href="/billing">My Billing</MobileNavLink>
                                            <MobileNavLink href="/maintenance">Maintenance</MobileNavLink>
                                        </>
                                    )}

                                    <button
                                        onClick={() => supabase.auth.signOut({ scope: 'local' }).catch(() => { }).finally(() => { window.location.href = '/' })}
                                        className="block w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-slate-50 transition-colors mt-2"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            </>
                        )}
                        {!isLoggedIn && (
                            <div className="pt-2 mt-2 border-t border-slate-100">
                                <Link href="/apply" className="w-full">
                                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 text-sm shadow-sm">
                                        APPLY NOW
                                    </Button>
                                </Link>
                                <Link href="/login" className="block w-full text-center mt-3 text-sm font-medium text-slate-600 hover:text-slate-900">
                                    Tenant Login
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="relative px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 tracking-wide transition-colors group"
        >
            {children}
            <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-slate-900 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
        </Link>
    );
}

function MobileNavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="block w-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600 rounded-md transition-colors"
        >
            {children}
        </Link>
    );
}
