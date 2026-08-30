// background
const GRID_BG: React.CSSProperties = {
  backgroundImage: `
    linear-gradient(to right, #e2e8f0 1px, transparent 1px),
    linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
  `,
  backgroundSize: '20px 30px',
  WebkitMaskImage:
    'radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)',
  maskImage:
    'radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)',
}

const PageBackdrop = () => (
  <div
    aria-hidden
    className="pointer-events-none fixed inset-3 z-0 overflow-hidden rounded-2xl bg-[#f8fafc]"
  >
    <div className="absolute inset-0" style={GRID_BG} />
  </div>
)

export default PageBackdrop
