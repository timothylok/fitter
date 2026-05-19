export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
      <h1 className="text-2xl font-bold">You&apos;re offline</h1>
      <p className="text-muted-foreground">
        Check your connection and try again.
      </p>
    </div>
  )
}
