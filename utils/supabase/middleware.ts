import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    // Intercept Supabase Auth PKCE codes from invite links that land on the homepage
    if (request.nextUrl.pathname === '/' && request.nextUrl.searchParams.has('code')) {
        const code = request.nextUrl.searchParams.get('code');
        return NextResponse.redirect(new URL(`/auth/callback?code=${code}&next=/account-setup`, request.url));
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const { data: { user } } = await supabase.auth.getUser()

    // Protect dashboard routes
    const dashboardRoutes = ['/calendar', '/settings', '/timesheets', '/billing', '/maintenance']
    const isDashboardRoute = dashboardRoutes.some(route => request.nextUrl.pathname.startsWith(route))

    if (!user && isDashboardRoute) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Admin protection
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // Check for admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    return response
}
