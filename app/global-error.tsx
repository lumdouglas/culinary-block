'use client'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html>
            <body>
                <div className="flex min-h-screen flex-col items-center justify-center gap-4">
                    <h2 className="text-2xl font-bold">Something went wrong!</h2>
                    <p className="text-gray-600">{error.message || "A critical error occurred."}</p>
                    <button
                        className="rounded-md bg-black px-4 py-2 text-sm text-white transition-colors hover:bg-black/90"
                        onClick={() => reset()}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    )
}
