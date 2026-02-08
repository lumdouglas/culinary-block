"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/user-menu"
import { createClient } from "@/utils/supabase/client"
import { MessageSquare } from "lucide-react"

export function SiteNav() {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setIsLoggedIn(!!user)
        }
        checkAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setIsLoggedIn(!!session?.user)
        })

        return () => subscription.unsubscribe()
    }, [supabase])

    return (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 shadow-sm">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center">
                        <Image
                            src="/logo.png"
                            alt="Culinary Block - Kitchen Rental Facilities"
                            width={800}
                            height={200}
                            className="h-16 w-auto object-contain sm:h-20 md:h-24 lg:h-32"
                            priority
                        />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-1">
                        <NavLink href="/">HOME</NavLink>
                        {isLoggedIn && (
                            <>
                                <NavLink href="/kiosk">TIMESHEET</NavLink>
                                <NavLink href="/calendar">SCHEDULING</NavLink>
                                <NavLink href="/contact">CONTACT</NavLink>
                            </>
                        )}
                        <Link href="/apply" className="ml-2">
                            <Button className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 shadow-md hover:shadow-lg transition-all">
                                APPLY NOW
                            </Button>
                        </Link>
                        <div className="ml-3 pl-3 border-l border-slate-200">
                            <UserMenu />
                        </div>
                    </nav>

                    {/* Mobile Navigation */}
                    <div className="lg:hidden flex items-center gap-3">
                        <UserMenu />
                        <Link href="/apply">
                            <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white font-semibold">
                                APPLY
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
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
