import fs from 'fs'

const file = 'app/(auth)/account-setup/page.tsx'
let content = fs.readFileSync(file, 'utf8')

const target = `        async function init() {
            // Check immediately if we already have a session
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                // If it's a new password recovery or invite, they need to set a password
                setCheckingAuth(false);
                return;
            }

            // If no immediate session, wait for the auth listener to pick up
            // the implicit token from the URL hash or cookies
            const { data } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
                if (event === 'INITIAL_SESSION') {
                    if (currentSession) {
                        setCheckingAuth(false);
                    } else {
                        // Check again after a delay, avoiding stale closure variables
                        setTimeout(async () => {
                            const { data: { session } } = await supabase.auth.getSession();
                            if (!session) {
                                setAuthError("Your invite link has expired or is invalid. Please contact your administrator.");
                            }
                            setCheckingAuth(false);
                        }, 1500);
                    }
                } else if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
                    if (currentSession) {
                        setCheckingAuth(false);
                    }
                }
            });
            subscription = data.subscription;
        }`

const replacement = `        async function init() {
            // Check immediately if we already have a session
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                // If it's a new password recovery or invite, they need to set a password
                setCheckingAuth(false);
                return;
            }

            // Manually capture implicit tokens from URL hash 
            // since Next.js @supabase/ssr prefers PKCE and may ignore them entirely
            const hash = typeof window !== 'undefined' ? window.location.hash : '';
            if (hash && hash.includes('access_token=')) {
                // Immediately remove hash to prevent infinite loops if component remounts
                const cleanUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';
                if (typeof window !== 'undefined') window.history.replaceState(null, '', cleanUrl);

                const params = new URLSearchParams(hash.substring(1));
                const access_token = params.get('access_token');
                const refresh_token = params.get('refresh_token');

                if (access_token && refresh_token) {
                    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
                    if (error) {
                        setAuthError(error.message);
                    } else {
                        setCheckingAuth(false);
                    }
                    return; // Skip standard listener
                }
            }

            // If no immediate session, wait for the auth listener to pick up
            const { data } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
                if (event === 'INITIAL_SESSION') {
                    if (currentSession) {
                        setCheckingAuth(false);
                    } else {
                        // Check again after a delay, avoiding stale closure variables
                        setTimeout(async () => {
                            const { data: { session } } = await supabase.auth.getSession();
                            if (!session) {
                                setAuthError("Your invite link has expired or is invalid. Please contact your administrator.");
                            }
                            setCheckingAuth(false);
                        }, 2500);
                    }
                } else if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
                    if (currentSession) {
                        setCheckingAuth(false);
                    }
                }
            });
            subscription = data.subscription;
        }`

if (content.includes(target)) {
    fs.writeFileSync(file, content.replace(target, replacement))
    console.log("SUCCESS")
} else {
    console.log("TARGET NOT FOUND. Looking for close matches...")
    console.log(content.substring(content.indexOf('async function init() {'), content.indexOf('subscription = data.subscription;') + 50))
}
