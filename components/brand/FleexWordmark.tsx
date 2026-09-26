interface FleexWordmarkProps {
  /** Rendered height in px; width scales automatically (asset is ~3:1) */
  height?: number
  className?: string
}

/**
 * The Fleex wordmark (the full "Fleex." logo with the orange dot).
 * Use this everywhere the brand name appears instead of hardcoding
 * text, so the mark stays consistent across the app.
 */
export default function FleexWordmark({
  height = 24,
  className = '',
}: FleexWordmarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/fleex-wordmark.png"
      alt="Fleex"
      style={{ height, width: 'auto' }}
      className={className}
    />
  )
}
