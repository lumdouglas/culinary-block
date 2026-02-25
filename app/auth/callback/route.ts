import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const tokenHash = requestUrl.searchParams.get('token_hash');
    const type = requestUrl.searchParams.get('type') ?? 'invite';
    const next = requestUrl.searchParams.get('next') ?? '/settings';

    // Build the redirect response first so we can set cookies ON it.
    // cookies() from next/headers does not apply to a returned NextResponse.redirect().
    const redirectTo = new URL(next, requestUrl.origin);
    const redirectResponse = NextResponse.redirect(redirectTo);
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        redirectResponse.cookies.set(name, value, options as Record<string, unknown>)
                    );
                },
            },
        }
    );

    if (code) {
        // PKCE authorization code flow
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) return redirectResponse;
    } else if (tokenHash) {
        // Email OTP / invite / magic-link flow — Supabase appends token_hash as a query param
        const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as 'invite' | 'signup' | 'recovery' | 'magiclink' | 'email_change' | 'email',
        });
        if (!error) return redirectResponse;
    } else {
        // No code, no token_hash = implicit flow (tokens in URL hash).
        // Server never sees the hash, so redirect client-side to preserve it for the destination.
        const nextEscaped = next.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Redirecting...</title></head><body><script>window.location.replace("${nextEscaped}"+window.location.hash);</script><p>Redirecting...</p></body></html>`;
        return new NextResponse(html, {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
        });
    }

    // Exchange failed; redirect without session (destination page will handle).
    return redirectResponse;
}
