import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/account-setup';

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Successful authentication via PKCE
            // Redirect to the designated page (defaulting to /account-setup for invites)
            return NextResponse.redirect(new URL(next, requestUrl.origin));
        }
    }

    // Handle errors or missing code
    // In a robust application, you might want to redirect to an explicit error page
    // e.g., `/login?error=Invalid+or+expired+link`
    return NextResponse.redirect(new URL('/login?error=Invalid link', requestUrl.origin));
}
