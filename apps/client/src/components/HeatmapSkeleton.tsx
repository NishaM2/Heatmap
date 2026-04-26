const HeatmapSkeleton = () => {
  return (
    <div className="rounded-lg border bg-card p-6 mb-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-3 w-3 rounded-full bg-muted" />
        <div className="h-4 w-24 bg-muted rounded" />
      </div>
      <div className="flex gap-3 mb-4">
        <div className="h-4 w-20 bg-muted rounded" />
        <div className="h-4 w-20 bg-muted rounded" />
        <div className="h-4 w-20 bg-muted rounded" />
      </div>
      <div className="h-20 bg-muted rounded" />
    </div>
  ) 
}

export default HeatmapSkeleton