export function RoadAnimation() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '40%',
        zIndex: 2,
        pointerEvents: 'none',
        opacity: 0.18,
      }}
    >
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Road surface */}
        <polygon
          points="400,320 1040,320 900,140 540,140"
          fill="#0d1f2d"
        />

        {/* Road edges */}
        <line x1="400" y1="320" x2="540" y2="140" stroke="#00d4ff" strokeWidth="2" opacity="0.6" />
        <line x1="1040" y1="320" x2="900" y2="140" stroke="#00d4ff" strokeWidth="2" opacity="0.6" />

        {/* Horizon glow */}
        <ellipse cx="720" cy="140" rx="200" ry="8" fill="#00d4ff" opacity="0.15" />

        {/* Center dashes — animated */}
        {[0, 1, 2, 3, 4].map((i) => {
          const t = i / 4
          const x1 = 720 + (720 - 540) * t * 0.5
          const y1 = 140 + (320 - 140) * t
          const x2 = 720 - (720 - 400) * t * 0.5
          const mid = (x1 + x2) / 2
          const h = 4 + t * 20
          return (
            <rect
              key={i}
              x={mid - 1}
              y={y1 - h / 2}
              width={2 + t * 3}
              height={h}
              fill="#00d4ff"
              opacity={0.3 + t * 0.4}
              style={{
                animation: `road-dash ${1.5 + i * 0.2}s linear infinite`,
              }}
            />
          )
        })}

        {/* Moving lights */}
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            r="3"
            fill="#f59e0b"
            opacity="0.8"
            style={{
              offsetPath: 'path("M 400 320 Q 720 200 900 140")',
              animation: `light-travel ${3 + i * 1.2}s linear ${i * 1.5}s infinite`,
            }}
          />
        ))}
      </svg>
    </div>
  )
}
