---
name: directives
description: >
  Reference for React and Next.js directives: 'use client', 'use server',
  and 'use cache'. Use when adding or explaining directives in components,
  server actions, or cached functions. Triggers on: "use client", "use server",
  "use cache", "directive", "client component", "server action".
---

# Directives

## React Directives

These are React directives, not Next.js specific.

### `'use client'`

Marks a component as a Client Component. Required for:
- React hooks (`useState`, `useEffect`, etc.)
- Event handlers (`onClick`, `onChange`)
- Browser APIs (`window`, `localStorage`)

```tsx
'use client'

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

Reference: https://react.dev/reference/rsc/use-client

### `'use server'`

Marks a function as a Server Action. Can be passed to Client Components.

```tsx
'use server'

export async function submitForm(formData: FormData) {
  // Runs on server
}
```

Or inline within a Server Component:

```tsx
export default function Page() {
  async function submit() {
    'use server'
    // Runs on server
  }
  return <form action={submit}>...</form>
}
```

Reference: https://react.dev/reference/rsc/use-server

---

## Next.js Directive

### `'use cache'`

Marks a function or component for caching. Part of Next.js Cache Components.

> ⚠️ **Not enabled in this project.** `'use cache'` requires `cacheComponents: true` in `next.config.ts`, which is not set. Do not use without enabling it first.

```tsx
'use cache'

export async function getCachedData() {
  return await fetchData()
}
```

For detailed usage including cache profiles, `cacheLife()`, `cacheTag()`, and `updateTag()`, see the `next-cache-components` skill.

Reference: https://nextjs.org/docs/app/api-reference/directives/use-cache