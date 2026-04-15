// Map effort level to Tailwind color class based on category color
export const getEffortColor = (
  effortLevel: number | null,
): string => {
  if (!effortLevel) return 'bg-muted hover:bg-muted/80'

  // Map hex color to tailwind shades
  // We use opacity to create intensity levels
  switch (effortLevel) {
    case 1: return 'opacity-25'
    case 2: return 'opacity-50'
    case 3: return 'opacity-75'
    case 4: return 'opacity-100'
    default: return 'opacity-0'
  }
}

// Get background style for a square using category color
export const getSquareStyle = (
  effortLevel: number | null,
  categoryColor: string
): React.CSSProperties => {
  if (!effortLevel) return {}

  const opacity = effortLevel === 1 ? 0.25
    : effortLevel === 2 ? 0.5
    : effortLevel === 3 ? 0.75
    : 1.0

  return {
    backgroundColor: categoryColor,
    opacity
  }
}

// Overall heatmap score colors
export const getOverallColor = (score: number): string => {
  switch (score) {
    case 0: return 'bg-muted'
    case 1: return 'bg-primary/40'
    case 2: return 'bg-primary'
    default: return 'bg-muted'
  }
}