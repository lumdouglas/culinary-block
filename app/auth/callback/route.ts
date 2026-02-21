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

    // If there is no code, it might be an implicit auth flow which uses URL hashes
    // Since the server can't see the hash, we redirect them to the destination page.
    // The destination page (e.g., /account-setup) will parse the hash on the client side.
    // If the link is truly invalid, the destination page's timeout will catch it and route them to /login.
    return NextResponse.redirect(new URL(next, requestUrl.origin));
}
