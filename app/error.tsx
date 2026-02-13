'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an analytics service
        console.error(error)
    }, [error])

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
            <h2 className="text-2xl font-bold">Something went wrong!</h2>
            <p className="text-muted-foreground">{error.message || "An unexpected error occurred."}</p>
            <button
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
            >
                Try again
            </button>
        </div>
    )
}
