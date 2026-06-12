export function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div
        className="w-10 h-10 border-2 border-graphite-200 border-t-emerald-accent rounded-full animate-spin"
        style={{ boxShadow: '0 0 20px -6px rgba(16, 185, 129, 0.25)' }}
      />
      <p className="text-sm text-graphite-500 mt-4 font-mono">{text}</p>
    </div>
  );
}
