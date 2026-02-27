import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const tokenHash = requestUrl.searchParams.get('token_hash');
    const type = requestUrl.searchParams.get('type') ?? 'invite';
    const next = requestUrl.searchParams.get('next') ?? '/settings';

    // On some mobile browsers and in-app webviews, Set-Cookie headers are dropped
    // if attached to a 30x redirect. To guarantee the session cookies are saved,
    // we return a 200 OK HTML page that sets the cookies and performs a JS redirect.
    const nextEscaped = next.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Authenticating...</title></head><body><script>window.location.replace("${nextEscaped}"+window.location.hash);</script><p>Authenticating, please wait...</p></body></html>`;

    const successResponse = new NextResponse(html, {
        status: 200,
        headers: {
            'Content-Type': 'text/html',
        },
    });

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
                        successResponse.cookies.set(name, value, options as Record<string, unknown>)
                    );
                },
            },
        }
    );

    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
            console.error('Auth callback error (code exchange):', error.message);
            return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin));
        }
        return successResponse;
    } else if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as 'invite' | 'signup' | 'recovery' | 'magiclink' | 'email_change' | 'email',
        });
        if (error) {
            console.error('Auth callback error (OTP/Invite):', error.message);
            return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin));
        }
        return successResponse;
    }

    // Implicit flow fallback
    return successResponse;
}
