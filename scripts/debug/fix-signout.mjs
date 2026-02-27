import fs from 'fs'

const files = [
    'components/user-menu.tsx',
    'components/site-nav.tsx',
    'app/(auth)/account-setup/page.tsx',
]

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8')
    
    // Replace user-menu.tsx signout
    if (file.includes('user-menu.tsx')) {
        content = content.replace(
            `    const handleSignOut = async () => {\n        await supabase.auth.signOut()\n        router.push('/')\n        router.refresh()\n    }`,
            `    const handleSignOut = async () => {\n        try {\n            await supabase.auth.signOut({ scope: 'local' })\n        } catch (e) { console.error(e) }\n        router.push('/')\n        router.refresh()\n    }`
        )
    }

    // Replace site-nav.tsx signout
    if (file.includes('site-nav.tsx')) {
        content = content.replace(
            `onClick={() => supabase.auth.signOut().then(() => { window.location.href = '/' })}`,
            `onClick={() => supabase.auth.signOut({ scope: 'local' }).catch(() => {}).finally(() => { window.location.href = '/' })}`
        )
    }

    // Replace account-setup/page.tsx signout
    if (file.includes('account-setup')) {
        content = content.replace(
            `if (error.message.includes("User from sub claim in JWT does not exist")) {\n                await supabase.auth.signOut();`,
            `if (error.message.includes("User from sub claim in JWT does not exist")) {\n                await supabase.auth.signOut({ scope: 'local' }).catch(() => {});`
        )
    }

    fs.writeFileSync(file, content)
}
console.log("Signout fixes applied.")
