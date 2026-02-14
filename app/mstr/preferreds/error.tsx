'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="container mx-auto p-6">
      <div className="bg-slate-800 border border-red-700/50 rounded-lg p-8 text-center">
        <h2 className="text-xl font-bold text-red-400 mb-4">Something went wrong</h2>
        <p className="text-slate-400 mb-2">{error.message}</p>
        <p className="text-slate-500 text-sm mb-6">{error.digest}</p>
        <button
          onClick={() => reset()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
